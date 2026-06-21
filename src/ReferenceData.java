import java.util.HashMap;
import java.util.Map;

public class ReferenceData {
    
    private static final Map<Integer, String> STAGES = new HashMap<>();
    
    // Explanation of stage codes
    static{
        STAGES.put(1, "NEW_TICKET");
        STAGES.put(2, "NEEDS_REWORK");
        STAGES.put(3, "READY_FOR_REVIEW");
        STAGES.put(4, "MANAGER_APPROVED");
        STAGES.put(5, "FINANCIAL_APPROVED");
        STAGES.put(6,"COMPLETED");

    }

    public static String getStages(int code){
        // Return the text value of the stage code
        return STAGES.getOrDefault(code, "UNKNOWN");
    }
}
