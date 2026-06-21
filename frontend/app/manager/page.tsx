import Ticket from "../components/Ticket";

interface ManagerTicketData {
    ticketId: number;
    employeeId: number;
    startDate: string;
    firstName: string;
    lastName: string;
    role: string;
    stage: string;
    jobDescription: string;
    stageCode: number;  
    requestedHardware: string;
    lastModified: string;
    viewMode: string;
}

export default async function ManagerPage() {
    let tickets: ManagerTicketData[] = [];
    let errorMsg = "";

    // Get all tickets with stage = 'Ready for Review'
    try {
        const res = await fetch("http://localhost:8080/api/tickets?stage=3");
        
        if (res.ok) {
            tickets = await res.json();
        } else {
            console.error("Server error:", await res.text());
        }
    } catch (e) {
        console.error("Couldn't connect to server! ", e);
    }

    return (
        <div className="bg-white  pl-40 pr-40 pt-2">
            <h1 className="text-2xl font-bold mb-2 text-teal-950 text-center p-10">Manager Dashboard</h1>

            <div className="flex flex-row">
                <h2 className="basis-2/3 text-xl font-bold text-teal-950 border-yellow-300 pb-3 border-b">Tickets</h2>
            </div>
                  
            {errorMsg && (
                <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-lg">
                    {errorMsg}
                </div>
            )}
            <div className="flex flex-col gap-6 w-full mt-5">
                {!errorMsg && tickets.length === 0 ? (
                    <p className="text-slate-500 bg-slate-50 p-4 rounded-lg border border-dashed text-center">
                        There are no tickets for HR.
                    </p>
                ) : (
                    tickets.map((t) => (
                        <Ticket 
                            key={t.ticketId} 
                            ticketId={t.ticketId}
                            firstName={t.firstName}
                            lastName={t.lastName}
                            role={t.role}
                            requestedHardware={t.requestedHardware}
                            stage={t.stage}
                            stageCode={t.stageCode}
                            lastModified={t.lastModified}
                            viewMode="manager"
                            jobDescription={t.jobDescription}
                            employeeId={t.employeeId}
                            startDate={t.startDate}
                        />
                    ))
                )}
            </div>
        </div>
    );
}