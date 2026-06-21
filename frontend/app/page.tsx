import Ticket from "./components/Ticket";

interface TicketData {
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
    jobDescription: string;
    startDate: string;
    hardwareBudget: string;
    hardwareDescription: string;
    email: string;
}


export default async function Home() {
  let tickets: TicketData[] = [];
  let errorMsg = "";
  
  // Get all tickets with the stage = 'Completed'
  try {
    const res = await fetch("http://localhost:8080/api/tickets?stage=6");
          
    if (res.ok) {
      tickets = await res.json();
    } else {
              console.error("Server error:", await res.text());
          }
      } catch (e) {
          console.error("Couldn't connect to server!:", e);
      }
  
      return (
             <div className="bg-white  pl-40 pr-40 pt-2">
                 <h1 className="text-2xl font-bold mb-2 text-teal-950 text-center p-10">Completed Tickets</h1>
     
                 <div className="flex flex-row">
                     <h2 className="basis-2/3 pb-3 text-xl font-bold text-teal-950 boder-yellow-300 border-b">Tickets</h2>
                 </div>
                       
                 {errorMsg && (
                     <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-lg">
                         {errorMsg}
                     </div>
                 )}
                 <div className="flex flex-col gap-6 w-full mt-5">
                     {!errorMsg && tickets.length === 0 ? (
                         <p className="text-slate-500 bg-slate-50 p-4 rounded-lg border border-dashed text-center">
                             There are no tickets for COMPLETED.
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
                                 viewMode="complete"
                                 startDate={t.startDate}
                                 jobDescription={t.jobDescription}
                                 hardwareBudget={t.hardwareBudget}
                                 hardwareDescription={t.hardwareDescription}
                                 email={t.email}
                             />
                         ))
                     )}
                 </div>
          </div>
      );
}
