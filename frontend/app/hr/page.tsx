import Ticket from "../components/Ticket";
import AddEmployee from "./AddEmployee";

interface EmployeeData {
  ticketId: number;          
  employeeId: number;       
  firstName: string;
  lastName: string;
  role: string;
  stage: string; 
  stageCode: number;         
  requestedHardware: string;
  lastModified: string;
  viewMode: string;
  startDate: string;
}

export default async function HrPage(){

    let employees: EmployeeData[] = [];
    let errorMsg = "";

    // Get all the tickets with stage = 'New ticket' or stage = 'Ready for review'
    try {
        const [resStage1, resStage2] = await Promise.all([
            fetch("http://localhost:8080/api/tickets?stage=1"),
            fetch("http://localhost:8080/api/tickets?stage=2")
        ]);

      
        if (!resStage1.ok || !resStage2.ok) {
            errorMsg = "Server error!";
        } else {

            const newTickets = await resStage1.json();
            const reworkTickets = await resStage2.json();

            employees = [...newTickets, ...reworkTickets];
            
        }
    } catch (error) {
        errorMsg = "Server connection failed!";
    }
   
    return( 
        <div className="bg-white  pl-40 pr-40 pt-2"> 
            <h1 className="text-2xl font-bold mb-2 text-teal-950 text-center p-10">HR Dashboard</h1>

            <div className="flex flex-row">
                <h2 className="basis-2/3 text-xl font-bold text-teal-950 border-yellow-300 border-b">Tickets</h2>

                <AddEmployee/>
                
             </div>
             {errorMsg && (
                <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-lg">
                 {errorMsg}
                </div>
            )}
            <div className="flex flex-col gap-6 w-full mt-5">
                {!errorMsg && employees.length === 0 ? (
                    <p className="text-slate-500 bg-slate-50 p-4 rounded-lg border border-dashed text-center">
                        There are no tickets for HR.
                    </p>
                ) : (
                    employees.map((emp) => (
                        <Ticket 
                            key={emp.ticketId} 
                            ticketId={emp.ticketId}        
                            employeeId={emp.employeeId} 
                            firstName={emp.firstName}
                            lastName={emp.lastName}
                            role={emp.role}
                            stage={emp.stage}       
                            stageCode={emp.stageCode} 
                            requestedHardware={emp.requestedHardware}
                            lastModified={emp.lastModified}
                            startDate={emp.startDate}
                            viewMode="hr"
                        />
                    ))
                )}
            </div>
           
        </div>
    );
}