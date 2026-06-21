import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.sql.*;
import org.mindrot.jbcrypt.BCrypt;

public class App {

    private static String[] getConnectionData(){

        // Retrun connection data (url, user, password) for DB from .env file 
        String url = null;
        String user = null;
        String password = null;

        try (BufferedReader br = new BufferedReader(new FileReader("src/.env"))){
            String line;

            while((line = br.readLine()) != null){

                // Skip empty or commented lines 
                if(line.trim().isEmpty() || line.startsWith("#"))
                    continue;

                String[] info = line.split("=", 2);

                if(info.length == 2){
                    String key = info[0].trim();
                    String value = info[1].trim();

                    switch (key) {
                        case "DB_URL":
                            url = value;    
                            break;
                        case "DB_USER":
                            user = value;
                            break;
                        case "DB_PASSWORD":
                            password = value;
                            break;
                    }
                }
            }
        } catch(IOException e){
            System.out.println(".env file not found!");
            
        }

        return new String[]{url, user, password};
    }

    public static void main(String[] args) throws Exception {
     
        // Initiate the HTTP server on port 8080
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // Register API endpoints and their corresponding handlers
        server.createContext("/api/tickets", new GetTicketHandler());
        server.createContext("/api/tickets/create", new CreateTicketHandler());
        server.createContext("/api/positions", new GetPositionHandler());
        server.createContext("/api/hardware", new GetHardwareHandler());
        server.createContext("/api/employees/update", new UpdateEmployeeHandler());
        server.createContext("/api/tickets/update-stage", new UpdateTicketStageHandler());
        server.createContext("/api/it/", new CreateCredentialsHandler());
        server.createContext("/api/it/check-credentials", new CheckCredentialsHandler());

        // Use the default executor for handling requests in separate thread
        server.setExecutor(null);

        // Start the server
        server.start();
        System.out.println("Java Server initiated successfully!");
    }


    static class GetTicketHandler implements HttpHandler{

        // Used to extract all the data required for the employees in a specified stage
        // In case that stage parameter is missing, it will extract all the data from all the employees
        @Override
        public void handle(HttpExchange exchange) throws IOException{

            // Configure CORS to allow access from the frontend application
            configureCORS(exchange);

            // Handle pre-flight OPTIONS request
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if("GET".equalsIgnoreCase(exchange.getRequestMethod())) {

                String queryParam = exchange.getRequestURI().getQuery();
                Integer stageFilter = null;

                // If the stage parameter is present, it will be parsed
                if (queryParam != null && queryParam.contains("stage=")) {
                    String[] parts = queryParam.split("stage=");
                    if (parts.length > 1) {
                        try {
                            stageFilter = Integer.parseInt(parts[1].split("&")[0]);
                        } catch (NumberFormatException e) {
                            System.out.println("Stage is not valid!");
                        }
                    }
                }

                // Build the base SQL query
                StringBuilder json = new StringBuilder("[");
                String sql = "SELECT t.ticket_id, e.employee_id, e.email, e.first_name, e.last_name, t.stage, e.requested_hardware, e.start_date,  p.title AS role_title, t.updated_at , p.description AS role_description, h.name, h.base_price, h.description AS hardware_description " +
                             "FROM tickets t " +
                             "INNER JOIN employees e ON t.employee_id = e.employee_id " +
                             "INNER JOIN positions p ON e.role = p.role_id " +
                             "INNER JOIN hardware_tiers h ON e.requested_hardware = h.id_hardware";

                // Add filter if tickets at a specific stage are requested
                if (stageFilter != null) {
                    sql += " WHERE t.stage = ?";
                }

                sql += "  ORDER BY t.updated_at DESC";
                
                String[] connectionData =  getConnectionData();
                try (Connection conn = DriverManager.getConnection(connectionData[0], connectionData[1], connectionData[2]);
                     PreparedStatement pstmt = conn.prepareStatement(sql)) {
                    
                    // Apply parameter to the prepared statement if filtering by stage
                    if (stageFilter != null) {
                        pstmt.setInt(1, stageFilter);
                    }

                    // Execute query and build JSON response
                    try (ResultSet rs = pstmt.executeQuery()) {
                        boolean first = true;
                        while (rs.next()) {
                            if (!first) json.append(",");
                            first = false;

                            // Retrieve and format row data
                            int stageCode = rs.getInt("stage");
                            String stageText = ReferenceData.getStages(stageCode);
                            String hardwareText = rs.getString("name");
                            int hardwarePrice = rs.getInt("base_price");
                            String hardwareDescription =rs.getString("hardware_description");
                            String jobDesc = rs.getString("role_description");
                            String email = rs.getString("email");
                            Date start_date = rs.getDate("start_date");

                            java.sql.Timestamp ts = rs.getTimestamp("updated_at"); 
                            String lastModifiedStr = (ts != null) ? ts.toString() : "";
                            
                            // Append formatted object to JSON array
                            json.append("{")
                                .append("\"ticketId\":").append(rs.getInt("ticket_id")).append(",")
                                .append("\"employeeId\":").append(rs.getInt("employee_id")).append(",")
                                .append("\"firstName\":\"").append(rs.getString("first_name")).append("\",")
                                .append("\"lastName\":\"").append(rs.getString("last_name")).append("\",")
                                .append("\"role\":\"").append(rs.getString("role_title")).append("\",") 
                                .append("\"stage\":\"").append(stageText).append("\",") 
                                .append("\"stageCode\":").append(stageCode).append(",")
                                .append("\"requestedHardware\":\"").append(hardwareText).append("\",") 
                                .append("\"lastModified\":\"").append(lastModifiedStr).append("\",")
                                .append("\"jobDescription\":\"").append(jobDesc != null ? jobDesc : "").append("\",")
                                .append("\"hardwareBudget\":\"").append(hardwarePrice).append("\",")
                                .append("\"hardwareDescription\":\"").append(hardwareDescription).append("\",")
                                .append("\"email\":\"").append(email).append("\",")
                                .append("\"startDate\":\"").append(start_date).append("\"")
                                .append("}");
                        }
                    }

                } catch (Exception e) {
                    sendResponse(exchange, 500, "{\"error\":\"DB error: " + e.getMessage() + "\"}");
                    return;
                }   

                json.append("]");
                sendResponse(exchange, 200, json.toString());
            } else {
                // Method not allowed for non-GET requests
                exchange.sendResponseHeaders(405, -1);
            }
        }

    }


    static class CreateTicketHandler implements HttpHandler{
        // Used to add a new employee and ticket in database
        // Send to frontend the new employee_id and ticket_id
        @Override
        public void handle(HttpExchange exchange) throws IOException{

            // Configure CORS to allow access from the frontend application
            configureCORS(exchange);

            // Handle pre-flight OPTIONS request
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {

                // Parse request body and extract employee info
                String body = new String(exchange.getRequestBody().readAllBytes(), "UTF-8");

                String firstName = extractJsonValue(body, "firstName");
                String lastName = extractJsonValue(body, "lastName");
                String role = extractJsonValue(body, "role").replace("\"", "");
                String startDate = extractJsonValue(body, "startDate");
                java.sql.Date sqlStartDate = java.sql.Date.valueOf(startDate);
                int hardware = Integer.parseInt(extractJsonValue(body, "requestedHardware"));

                int roleId = -1;

                // SQL query used to get the role_id based on the title position
                String sqlFindRole = "SELECT role_id FROM positions WHERE title = ?";

                // SQL query used to insert an employee in database and to return the employee_id created
                String sql1 = "INSERT INTO employees (first_name, last_name, role, start_date, requested_hardware) VALUES (?, ?, ?, ?, ?) RETURNING employee_id";
                
                // SQL query used to insert a ticket in database and to return the ticket_id created
                String sql2 = "INSERT INTO tickets (employee_id, stage) VALUES (?, ?) RETURNING ticket_id";

                String[] connectionData =  getConnectionData();

                try (Connection conn = DriverManager.getConnection(connectionData[0], connectionData[1], connectionData[2])){

                    try(PreparedStatement stmtRole = conn.prepareStatement(sqlFindRole)) {
                        
                        // Retrieve the role ID based on the provided title
                        stmtRole.setString(1, role);
                        try (ResultSet rsRole = stmtRole.executeQuery()) {
                            if (rsRole.next()) {
                                roleId = rsRole.getInt("role_id"); 
                            }
                        }
                    }
                    if (roleId == -1) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Role was not found!\"}");
                        return; 
                    }
                    
                    // Insert the new employee and retrieve the generated employee_id
                    try(PreparedStatement pstmt = conn.prepareStatement(sql1)) {
                        pstmt.setString(1, firstName);
                        pstmt.setString(2, lastName);
                        pstmt.setInt(3, roleId);
                        pstmt.setDate(4, sqlStartDate);
                        pstmt.setInt(5, hardware);
                    
                        ResultSet rs = pstmt.executeQuery();
                        
                        int newId = -1;

                        if (rs.next()) {
                            newId = rs.getInt(1); 
                        }

                        // Create the ticket for the new employee
                        if (newId != -1) {
                            try (PreparedStatement pstmt2 = conn.prepareStatement(sql2)) {

                                pstmt2.setInt(1, newId); 
                                pstmt2.setInt(2, 1); // Set stage to 1
            
                                ResultSet rs2 = pstmt2.executeQuery();
            
                                if (rs2.next()) {
                                    int newTicketId = rs2.getInt(1);
                                    sendResponse(exchange, 201, "{\"success\":true,\"ticketId\":" + newTicketId + "}"); 
                                } else {
                                    sendResponse(exchange, 500, "{\"success\":false,\"error\":\"Ticket was not created!\"}");
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    try {
                        sendResponse(exchange, 500, "{\"success\":false,\"error\":\"Server error: " + e.getMessage() + "\"}");
                    } catch (IOException ioException) {
                        ioException.printStackTrace();
                    }
                }
            }
        }
    }

    
    static class GetHardwareHandler implements HttpHandler{
        // Used to extract the all hardware tiers
        @Override
        public void handle(HttpExchange exchange) throws IOException{

            // Configure CORS to allow access from the frontend application
            configureCORS(exchange);

            // Handle pre-flight OPTIONS request
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                StringBuilder json = new StringBuilder("[");

                // SQL query used to select hardware id and tier name from hardware_tiers table
                String query = "SELECT id_hardware, name FROM hardware_tiers"; 

                String[] connectionData =  getConnectionData();
                try (Connection conn = DriverManager.getConnection(connectionData[0], connectionData[1], connectionData[2]);
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {

                    boolean first = true;
                    // Iterate through the results and build the JSON array
                    while (rs.next()) {
                        if (!first) json.append(",");
                        
                        first = false;

                        json.append("{")
                            .append("\"id\":").append(rs.getInt("id_hardware")).append(",")
                            .append("\"tier\":\"").append(rs.getString("name")).append("\"")
                            .append("}");
                    }
                } catch (Exception e) {
                    sendResponse(exchange, 500, "{\"error\":\"Error: " + e.getMessage() + "\"}");
                    return;
                }

            json.append("]");
            sendResponse(exchange, 200, json.toString());
        } else {
            exchange.sendResponseHeaders(405, -1);
        }
        }
    }


    static class GetPositionHandler implements HttpHandler{
        // Used to extract all role titles from database
        @Override
        public void handle(HttpExchange exchange) throws IOException{

            // Configure CORS to allow access from the frontend application
            configureCORS(exchange);

            // Handle pre-flight OPTIONS request
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                StringBuilder json = new StringBuilder("[");

                // SQL quesry used to get all roles title and id from table positions
                String query = "SELECT role_id, title FROM positions ORDER BY title ASC"; 

                String[] connectionData =  getConnectionData();
                try (Connection conn = DriverManager.getConnection(connectionData[0], connectionData[1], connectionData[2]);
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {

                boolean first = true;

                // Iterate through the results and build the JSON array
                while (rs.next()) {
                    if (!first) json.append(",");
                    
                    first = false;

                    json.append("{")
                        .append("\"id\":").append(rs.getInt("role_id")).append(",")
                        .append("\"title\":\"").append(rs.getString("title")).append("\"")
                        .append("}");
                }
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\":\"Error: " + e.getMessage() + "\"}");
                return;
            }

            json.append("]");
            sendResponse(exchange, 200, json.toString());
        } else {
            exchange.sendResponseHeaders(405, -1);
        }
        }
    }


    static class UpdateEmployeeHandler implements HttpHandler {
        // Used to update an employee data 
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            
            // Configure CORS to allow access from the frontend application
            configureCORS(exchange);

            // Handle pre-flight OPTIONS request
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
       
            if ("PUT".equalsIgnoreCase(exchange.getRequestMethod())) {
                try {
 
                    // Parse the employee_id
                    String query = exchange.getRequestURI().getQuery(); 
                    int employeeId = -1;
                    if (query != null && query.startsWith("id=")) {
                        employeeId = Integer.parseInt(query.split("=")[1]);
                    }

                    if (employeeId == -1) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"EmployeeID is missing!\"}");
                        return;
                    }
                    
                    // Parse request body and extract employee info
                    String body = new String(exchange.getRequestBody().readAllBytes(), "UTF-8");
                    
                    String firstName = extractJsonValue(body, "firstName").replace("\"", "");
                    String lastName = extractJsonValue(body, "lastName").replace("\"", "");
                    String roleTitle = extractJsonValue(body, "role").replace("\"", ""); 
                    String hardwareTier = extractJsonValue(body, "requestedHardware").replace("\"", "");
                    int hardwareId = Integer.parseInt(hardwareTier);

                    String[] connectionData = getConnectionData();

                    try (Connection conn = DriverManager.getConnection(connectionData[0], connectionData[1], connectionData[2])) {
         
                        int roleId = -1;
                        
                        // SQL query used to get the role id based on the title value
                        String sqlFindRole = "SELECT role_id FROM positions WHERE title = ?";
                        try (PreparedStatement stmtRole = conn.prepareStatement(sqlFindRole)) {
                            stmtRole.setString(1, roleTitle);
                            try (ResultSet rsRole = stmtRole.executeQuery()) {
                                if (rsRole.next()) {
                                    roleId = rsRole.getInt("role_id");
                                }
                            }
                        }

                        if (roleId == -1) {
                            sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Role was not found!\"}");
                            return;
                        }
                        
                        // SQL query used to update the employee data
                        String sqlUpdate = "UPDATE employees SET first_name = ?, last_name = ?, role = ?, requested_hardware = ? WHERE employee_id = ?";
                        
                        try (PreparedStatement pstmt = conn.prepareStatement(sqlUpdate)) {
                            pstmt.setString(1, firstName);
                            pstmt.setString(2, lastName);
                            pstmt.setInt(3, roleId);
                            pstmt.setInt(4, hardwareId);
                            pstmt.setInt(5, employeeId); 
                            
                            int rowsUpdated = pstmt.executeUpdate(); 

                            if (rowsUpdated > 0) {
                                sendResponse(exchange, 200, "{\"success\":true}");
                            } else {
                                sendResponse(exchange, 404, "{\"success\":false,\"error\":\"Employee was not found!\"}");
                            }
                        }
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                    sendResponse(exchange, 500, "{\"success\":false,\"error\":\"Update error: " + e.getMessage() + "\"}");
                }
            } else {
                exchange.sendResponseHeaders(405, -1); 
            }
        }
    }


    static class UpdateTicketStageHandler implements HttpHandler {
        // Used to update the stage of a ticket 
        @Override
        public void handle(HttpExchange exchange) throws IOException {

            // Configure CORS to allow access from the frontend application
            configureCORS(exchange);

            // Handle pre-flight OPTIONS request
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("PUT".equalsIgnoreCase(exchange.getRequestMethod())) {
                try {
                    // Extract ticketId and action from the query parameters
                    String query = exchange.getRequestURI().getQuery();
                    int ticketId = -1;
                    String action = "";

                    if (query != null) {
                        String[] params = query.split("&");
                        for (String param : params) {
                            if (param.startsWith("id=")) ticketId = Integer.parseInt(param.split("=")[1]);
                            if (param.startsWith("action=")) action = param.split("=")[1];
                        }
                    }

                    if (ticketId == -1 || action.isEmpty()) {
                        sendResponse(exchange, 400, "{\"success\":false,\"error\":\"Incorrect parameters!\"}");
                        return;
                    }

                    String[] connectionData = getConnectionData();
                    
                    try (Connection conn = DriverManager.getConnection(connectionData[0], connectionData[1], connectionData[2])) {
                        

                        int currentStage = -1;
                        int hardwareType = 1; 
                        
                        // SQL query used to extract the stage and requsted harware for a ticket
                        String sqlSelect = "SELECT t.stage, e.requested_hardware FROM tickets t " +
                                           "JOIN employees e ON t.employee_id = e.employee_id " +
                                           "WHERE t.ticket_id = ?";
                                           
                        try (PreparedStatement pstmtSelect = conn.prepareStatement(sqlSelect)) {
                            pstmtSelect.setInt(1, ticketId);
                            try (ResultSet rs = pstmtSelect.executeQuery()) {
                                if (rs.next()) {
                                    currentStage = rs.getInt("stage");
                                    hardwareType = rs.getInt("requested_hardware");
                                } else {
                                    sendResponse(exchange, 404, "{\"success\":false,\"error\":\"Ticket not found!\"}");
                                    return;
                                }
                            }
                        }

                        int newStage = currentStage;

                        // Update stage logic
                        if ("reject".equalsIgnoreCase(action)) {
                            newStage = 2; // Move to 'Needs rework'
                        } else if ("approve".equalsIgnoreCase(action)) {
                            if (currentStage == 1 || currentStage == 2) {
                                newStage = 3; // Move to 'Ready for review'
                            } else if (currentStage == 3) {
                                // Check if the hardware is not 'Standard'
                                if (hardwareType != 1) {
                                    newStage = 4; // Move to 'Manager Approved'
                                } else {
                                    newStage = 5; // Move to 'Finance Approved'
                                }
                            } else if (currentStage == 4) {
                                    newStage = 5; // Move to 'Finance Approved'
                            } else if (currentStage == 5) {
                                newStage = 6; // Move to 'Completed'
                            }
                        }

                        // SQL query used to update a ticket stage
                        String sqlUpdate = "UPDATE tickets SET stage = ? WHERE ticket_id = ?";
                        try (PreparedStatement pstmtUpdate = conn.prepareStatement(sqlUpdate)) {
                            pstmtUpdate.setInt(1, newStage);
                            pstmtUpdate.setInt(2, ticketId);
                            
                            int rowsUpdated = pstmtUpdate.executeUpdate();
                            if (rowsUpdated > 0) {
                                sendResponse(exchange, 200, "{\"success\":true}");
                            } else {
                                sendResponse(exchange, 500, "{\"success\":false,\"error\":\"Update error!\"}");
                            }
                        }
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                    sendResponse(exchange, 500, "{\"success\":false,\"error\":\"Error: " + e.getMessage() + "\"}");
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }


    static class CreateCredentialsHandler implements HttpHandler {
        // Used to update an employee email and password
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            
            // Configure CORS to allow access from the frontend application
            configureCORS(exchange);

            // Handle pre-flight OPTIONS request
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equals(exchange.getRequestMethod())){
                try{
                    // Extract and parse the request body
                    String body = new String(exchange.getRequestBody().readAllBytes(), "UTF-8");
                    String employeeId = extractJsonValue(body, "employee").replace("\"", "");
                    String email = extractJsonValue(body, "email").replace("\"", "");
                    String rawPassword = extractJsonValue(body, "password").replace("\"", "");
                    int employee = Integer.parseInt(employeeId);
                    // Hash the password for secure storage using BCrypt
                    String hashedPassword = BCrypt.hashpw(rawPassword, BCrypt.gensalt(12));

                    String[] connectionData = getConnectionData();
                    
                    try (Connection conn = DriverManager.getConnection(connectionData[0], connectionData[1], connectionData[2])) {
                        
                        // SQL query used to update an employee credentials
                        String sqlUpdate = "UPDATE employees SET email = ?, password = ? WHERE employee_id = ?";
                        try (PreparedStatement pstmtUpdate = conn.prepareStatement(sqlUpdate)) {
                            pstmtUpdate.setString(1, email);
                            pstmtUpdate.setString(2, hashedPassword);
                            pstmtUpdate.setInt(3, employee);
                            
                            int rows = pstmtUpdate.executeUpdate();
                            
                            if (rows > 0) {
                                sendResponse(exchange, 200, "{\"success\": true, \"message\": \"Credentials saved!\"}");
                            } else {
                                sendResponse(exchange, 500, "{\"success\": false, \"error\": \"Update failed!\"}");
                            }
                        }
                    } 
                } catch (Exception e) {
                    e.printStackTrace();
                    sendResponse(exchange, 500, "{\"error\": \"Server error: " + e.getMessage() + "\"}");
                    }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }


    static class CheckCredentialsHandler implements HttpHandler {
        // Used to check if the credentials of an employee were set
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Configure CORS to allow access from the frontend application
            configureCORS(exchange);

            // Handle pre-flight OPTIONS request
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())){
                try{
                    // Extract the employeeId parsed
                    String query = exchange.getRequestURI().getQuery();
                    String employeeId = query.split("=")[1];

                    String[] connectionData = getConnectionData();
                        
                    try (Connection conn = DriverManager.getConnection(connectionData[0], connectionData[1], connectionData[2]))  {
                        
                        // SQL query used to get credentials of an employee
                        String sql = "SELECT email, password FROM employees WHERE employee_id = ?";
                            
                        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                                
                            pstmt.setInt(1, Integer.parseInt(employeeId));
                                
                            try (ResultSet rs = pstmt.executeQuery()) {
                                
                                boolean exists = rs.next() && rs.getString("email") != null && rs.getString("password") != null;
                                sendResponse(exchange, 200, "{\"exists\": " + exists + "}");
                                }
                            }
                        }
                } catch (Exception e) {
                    sendResponse(exchange, 500, "{\"error\": \"DB Error!\"}");
                }
            } else {
                sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
                return;
            }
        }
    }


    private static void configureCORS(HttpExchange exchange) {
        // Configure Cross-Origin Resource Sharing (CORS) headers to enable communication 
        // between the frontend (localhost:3000) and the backend

        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "http://localhost:3000");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    
    private static void sendResponse(HttpExchange exchange, int statusCode, String responseText) throws IOException {
        // Sends a formatted JSON response back to the client
        
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        byte[] bytes = responseText.getBytes("UTF-8");

        // Set the response length before sending headers
        exchange.sendResponseHeaders(statusCode, bytes.length);

        // Write the response body and ensure the output stream is closed
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
    
    
    private static String extractJsonValue(String json, String key) {
        // Parses a simple JSON string to extract the value associated with a given key.

        String search = "\"" + key + "\":";
        int start = json.indexOf(search);
        if (start == -1) return "";
        start += search.length();
        int openQuote = json.indexOf("\"", start);
        int closeQuote = json.indexOf("\"", openQuote + 1);
        if (openQuote != -1 && closeQuote != -1) {
            return json.substring(openQuote + 1, closeQuote);
        }
        return "";
    }

}
