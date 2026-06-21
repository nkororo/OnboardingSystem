import java.util.HashMap;
import java.util.Map;

public class ReferenceData {
    
    private static final Map<Integer, String> STAGES = new HashMap<>();
    
    // Explanation of stage codes
    static{
        STAGES.put(1, "NEW TICKET");
        STAGES.put(2, "NEEDS REWORK");
        STAGES.put(3, "READY FOR REVIEW");
        STAGES.put(4, "MANAGER APPROVED");
        STAGES.put(5, "FINANCIAL APPROVED");
        STAGES.put(6,"COMPLETED");

    }

    public static String getStages(int code){
        // Return the text value of the stage code
        return STAGES.getOrDefault(code, "UNKNOWN");
    }
}
