import Ticket from "../components/Ticket";

interface ItTicketData {
    employeeId: number;
    ticketId: number;
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

export default async function ItPage() {
    
    let tickets: ItTicketData[] = [];
    let errorMsg = "";

    // Get all tickets with stage = 'Finance Approved'
     try {
        const res = await fetch("http://localhost:8080/api/tickets?stage=5");
        
        if (res.ok) {
            tickets = await res.json();
        } else {
            console.error("Server error! ", await res.text());
        }
    } catch (e) {
        console.error("Couldn't connect to Java server!", e);
    }

    return (
           <div className="bg-white  pl-40 pr-40 pt-2">
               <h1 className="text-2xl font-bold mb-2 text-teal-950 text-center p-10">IT Dashboard</h1>
   
               <div className="flex flex-row">
                   <h2 className="basis-2/3 text-xl font-bold text-teal-950 pb-3 border-yellow-300 border-b">Tickets</h2>
               </div>
                     
               {errorMsg && (
                   <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-lg">
                       {errorMsg}
                   </div>
               )}
               <div className="flex flex-col gap-6 w-full mt-5">
                   {!errorMsg && tickets.length === 0 ? (
                       <p className="text-slate-500 bg-slate-50 p-4 rounded-lg border border-dashed text-center">
                           There are no tickets for IT.
                       </p>
                   ) : (
                       tickets.map((t) => (
                           <Ticket 
                               key={t.ticketId} 
                               employeeId={t.employeeId}
                               ticketId={t.ticketId}
                               firstName={t.firstName}
                               lastName={t.lastName}
                               role={t.role}
                               requestedHardware={t.requestedHardware}
                               stage={t.stage}
                               stageCode={t.stageCode}
                               lastModified={t.lastModified}
                               viewMode="it"
                               startDate={t.startDate}
                           />
                       ))
                   )}
               </div>
        </div>
    );
}