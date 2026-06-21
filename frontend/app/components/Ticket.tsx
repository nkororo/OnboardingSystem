'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import EmployeeForm from './EmployeeForm';

const STAGE_DICTIONARY: Record<number, {styles: string}> = {
    1: {styles: "bg-yellow-600 text-white"},
    2: {styles: "bg-red-600 text-white"},
    3: {styles: "bg-sky-600 text-white"},
    4: {styles: "bg-purple-600 text-white"},
    5: {styles: "bg-teal-600 text-white"},
    6: {styles: "bg-green-600 text-white"}
};

interface TicketProps {
    ticketId: number;
    employeeId: number;
    firstName: string; 
    lastName: string;
    role: string;         
    stage?: string;
    stageCode: number;
    requestedHardware: string;
    lastModified: string;
    viewMode?: 'hr' | 'manager' | 'it' | 'finance' | 'complete'; 
    jobDescription?: string;
    startDate: string;
    hardwareBudget?: string;
    hardwareDescription?: string;
    email?: string;
}

export default function Ticket({ticketId, employeeId, stageCode, startDate, stage, firstName, lastName, role, requestedHardware, lastModified, viewMode, jobDescription, hardwareBudget, hardwareDescription, email} : TicketProps){
  const router = useRouter();  

  const stageInfo = STAGE_DICTIONARY[stageCode] || {styles: "bg-mist-600 text-white"};

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isCredModalOpen, setIsCredModalOpen] = useState(false);
    const [credData, setCredData] = useState({ email: '', password: '' });
    const [isLaptopConfigured, setIsLaptopConfigured] = useState(false);
    const [areCredentialsSet, setAreCredentialsSet] = useState(false);
    const [loadingCredentials, setLoadingCredentials] = useState(true);

    useEffect(() => {
      if (viewMode === 'it') {
        fetch(`http://localhost:8080/api/it/check-credentials?employeeId=${employeeId}`)
            .then(res => res.json())
            .then(data => {
                setAreCredentialsSet(data.exists);
                setLoadingCredentials(false);
            })
            .catch(() => setLoadingCredentials(false));
      }
    }, [employeeId, viewMode]);

    const handleStageChange = async (isApprove: boolean) => {
        setActionLoading(true);
        const actionString = isApprove ? 'approve' : 'reject';

        try {
            const res = await fetch(`http://localhost:8080/api/tickets/update-stage?id=${ticketId}&action=${actionString}`, {
                method: 'PUT',
            });

            const data = await res.json();

            if (data.success) {
                router.refresh(); 
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert("Couldn't connect to server!");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveCredentials = async () => {
    if(credData.email != "" && credData.password != ""){
        try {
            const res = await fetch(`http://localhost:8080/api/it/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    employee: employeeId.toString(), 
                    email: credData.email,
                    password: credData.password
                })
            });

            if (res.ok) {
                setIsCredModalOpen(false);
                setAreCredentialsSet(true);
            }
        } catch (error) {
            console.error("Error saving credentials:", error);
        }
    } else {
        displayError("All fields must not be empty!");
    }
};
const displayError = (mesaj) => {
    // Display an error toast
  const div = document.createElement('div');

  div.className = `
    basis-1/3 fixed bottom-5 right-5 z=[9999] px-6 py-4 rounded-lg shadow-lg 
    bg-rose-600 text-white font-bold cursor-pointer transition-all duration-300
  `;
  
  div.innerText = mesaj;
  div.onclick = () => {
    div.classList.add('opacity-0');
    setTimeout(() => div.remove(), 300);
  };

  document.body.appendChild(div);

  setTimeout(() => {
    if (document.body.contains(div)) {
      div.classList.add('opacity-0');
      setTimeout(() => div.remove(), 300);
    }
  }, 4000);
};
    const displayDate = lastModified ? new Date(lastModified).toLocaleDateString('ro-RO') : 'N/A';

    
    return(
      <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Ticket#{ticketId}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
              Modificat: {displayDate}
          </span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${stageInfo.styles}`}>
            {stage}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-teal-950">
            {firstName} {lastName}
          </h3>
          <p className="text-sm text-olive-500 font-medium mt-1">
            {role}
          </p>
          <p className="text-sm text-olive-500 font-medium mt-1">
            Start Date: <span className="font-semibold text-slate-600">{startDate}</span>
          </p>
          <p className="text-sm text-olive-500 font-medium mt-2">
            Hardware: <span className="font-semibold text-slate-600">{requestedHardware}</span>
          </p>

          {(viewMode === 'manager' || viewMode === 'complete' )&& jobDescription && (
                <div className="border-t pt-4 mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-3 uppercase">Job Description</h4>
                    <p className="bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-200">
                        {jobDescription}
                    </p>
                </div>
          )}

            {(viewMode === 'finance' || viewMode === 'complete') && (
                <>
                  <div className="border-t pt-4 mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-3 uppercase">Finance Details</h4>
                      <div className="flex flex-row gap-4 items-center">
                       
                        <div className="p-3 w-1/3 rounded-sm text-sm bg-yellow-300 text-teal-950 text-center">
                          <span className="font-medium">Hardware Budget: </span>
                          <span className="font-bold">{hardwareBudget ? `${hardwareBudget} RON` : 'N/A'}</span>
                        </div>

        
                        <p className="flex-1 bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-200">
                          {hardwareDescription || ''}
                        </p>
                      </div>
                  </div>
                </>
            )}

            {viewMode === 'it' && (
                <div className="border-t pt-4 mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-3 uppercase">IT Provisioning</h4>
                    
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">
                                Set Account Credentials: {areCredentialsSet ? "Credentials are set" : "No"}
                            </span>
                            <button 
                                onClick={() => setIsCredModalOpen(true)}
                                className={"w-20 text-white font-xs rounded-sm bg-teal-950 hover:bg-yellow-300 hover:text-teal-950"}
                            >
                                {areCredentialsSet ? 'Edit' : 'Set'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-5">
                            <span className="text-sm text-slate-700">Laptop Configuration Confirmation</span>
                            <input 
                                type="checkbox" 
                                checked={isLaptopConfigured}
                                onChange={(e) => setIsLaptopConfigured(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300" 
                            />
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'complete' && (
                <div className="border-t pt-4 mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-3 uppercase">Credentials</h4>
                    <p className="bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-200">
                        {email}
                    </p>
                </div>
            )}
        </div>

        <div className="flex pt-3 border-t justify-end gap-3">
          {viewMode === 'hr' && (
        <>
            <button onClick={() => setIsEditing(true)} className="bg-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-yellow-300 hover:text-teal-950 rounded-lg">Edit Info</button>
            <button onClick={() => handleStageChange(true)} disabled={actionLoading} className="w-40 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-300 hover:text-teal-950">
               Send to Review
            </button>
        </>
    )}

    {(viewMode === 'manager' || viewMode === 'finance') && (
        <>
            <button onClick={() => handleStageChange(false)} className="bg-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-yellow-300 hover:text-teal-950 rounded-lg">Reject</button>
            <button onClick={() => handleStageChange(true)} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-yellow-300 hover:text-teal-950">Approve</button>
        </>
    )}

    {(viewMode === 'it') && (
        <>
            <button onClick={() => handleStageChange(false)} className="bg-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-yellow-300 hover:text-teal-950 rounded-lg">Reject</button>
            <button 
                onClick={() => handleStageChange(true)} 
                disabled={viewMode === 'it' && (!areCredentialsSet || !isLaptopConfigured)}
                className={`px-5 py-2 rounded-lg ${
                    (viewMode === 'it' && (!areCredentialsSet || !isLaptopConfigured)) 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-yellow-300 hover:text-teal-950'
                }`}
            >
                Approve
            </button>
        </>
    )}

        </div>
      </div>

      {isCredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
                <h3 className="text-lg font-bold mb-4">Set Credentials</h3>
                <div className="flex flex-col gap-3">
                    <input 
                        type="email"
                        required 
                        placeholder="@rinftech.com" 
                        className="border p-2 rounded"
                        onChange={e => setCredData({...credData, email: e.target.value})}
                    />
                    <input 
                        type="password" 
                        placeholder="password" 
                        className="border p-2 rounded"
                        onChange={e => setCredData({...credData, password: e.target.value})}
                    />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setIsCredModalOpen(false)} className="bg-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-yellow-300 hover:text-teal-950 rounded-lg">
                        Cancel
                    </button>

                    <button 
                        onClick={handleSaveCredentials} 
                        className="bg-teal-950 hover:bg-yellow-300 text-yellow-300 hover:text-teal-950 px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                        Submit
                    </button>
                    
                </div>
            </div>
        </div>
      )}
      {isEditing && (
          <EmployeeForm 
            initialData={{ 
                employeeId, 
                firstName, 
                lastName, 
                role, 
                startDate,
                requestedHardware 
            }}
            onSaveSuccess={() => {
                setIsEditing(false);
                router.refresh();
            }}
        />        
      )}
    </>
    );
}