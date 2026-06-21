'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddEmployeeFormProps {
    initialData?: any;
    onSaveSuccess?: () => void;
}
interface Position {
  id: number;
  title: string;
}

interface Hardware {
  id: number;
  tier: string;
}

export default function EmployeeForm({ initialData, onSaveSuccess }: AddEmployeeFormProps) {

    const router = useRouter();
    const [message, setMessage] = useState('');
    
    const [positions, setPositions] = useState<Position[]>([]);
    const [hardwareOptions, setHardwareOptions] = useState<Hardware[]>([]);
    const [isRolesLoaded, setIsRolesLoaded] = useState(false);
    const [isHardwareLoaded, setIsHardwareLoaded] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        role: '', 
        startDate: '',
        requestedHardware: ''
    });

    // True if we have data
    const isEditMode = !!initialData
    useEffect(() => {
        // Get all hardware tiers and role titles from database
        const fetchData = async () =>  {
            try {
                const [resPos, resHw] = await Promise.all([
                    fetch('http://localhost:8080/api/positions'),
                    fetch('http://localhost:8080/api/hardware')
                ]);
                const posData = await resPos.json();
                const hwData = await resHw.json();

                setPositions(posData);
                setHardwareOptions(hwData);
                
                setIsRolesLoaded(true);
                setIsHardwareLoaded(true);
            } catch (error) {
                console.error("Error: ", error);
            }
        };

      fetchData();
    }, []);

    useEffect(() => {
      // Populate the form with ticket date atfer loading hardware tiers and roles titles
      if (initialData && isHardwareLoaded && isRolesLoaded) {
          setFormData({
              firstName: initialData.firstName || '',
              lastName: initialData.lastName || '',
              role: initialData.role || '',
              startDate: initialData.startDate || '',
              requestedHardware: initialData.requestedHardware || ''
          });
      }
    }, [initialData, isHardwareLoaded, isRolesLoaded]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Check if the all fields are filled
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.startDate) { 
          alert("Empty fields are not allowed!");
          return;
      }
      
      setMessage('');
      const selectedHw = hardwareOptions.find(h => h.tier === formData.requestedHardware);
      const hwId = selectedHw ? selectedHw.id.toString() : "";
      
      console.log(selectedHw);

      const payload = {
        ...formData,
        requestedHardware: hwId
      }
      
      const url = isEditMode ?  `http://localhost:8080/api/employees/update?id=${initialData.employeeId}`: 
                                `http://localhost:8080/api/tickets/create`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      const message = isEditMode ? 'Ticket was updated!' : 'Ticket was added in database!'
      try {
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setMessage(message);
        if (onSaveSuccess) {
            onSaveSuccess(); 
        }
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (error) {
      setMessage("Couldn't connect to Java server!" + error);
    } 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
        <form 
          onSubmit={handleSubmit} 
          className="relative z-10 w-full max-w-xl bg-white p-6 rounded-2xl border-2 border-yellow-300 shadow-2xl flex flex-col gap-4 text-left animation-fade-in"
        >
         
          <h2 className="text-xl font-bold text-teal-950 p-3 text-center">New Employee Onboarding</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-teal-950">First Name</label>
              <input 
                  required 
                  type="text" 
                  className="border rounded-md p-2" 
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value.replace(/^\s+/, '')})} 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-teal-950">Last Name</label>
              <input 
                  required 
                  type="text" 
                  className="border rounded-md p-2" 
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value.replace(/^\s+/, '')})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-teal-950">Role</label>
              <select 
                  required
                  className="border rounded-md p-2" 
                  value={formData.role || ""} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
              >
                  <option value="" disabled>Select a role</option>
                  {positions.map(pos => (
                      <option key={pos.id} value={pos.title}>
                          {pos.title}
                      </option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-teal-950">Start Date</label>
              <input 
                required 
                type="date" 
                className="border rounded-md p-2" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-teal-950">Requested Hardware</label>
            <select 
                required
                className="border rounded-md p-2" 
                value={formData.requestedHardware || ""} 
                onChange={e => setFormData({...formData, requestedHardware: e.target.value})}
                >
                  <option value="" disabled>Select a tier</option>
                  {hardwareOptions.map(hw => (
                      <option key={hw.id} value={hw.tier}>
                          {hw.tier}
                      </option>
                  ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end mt-4 border-t pt-4">
            <button 
              type="button" 
              onClick={onSaveSuccess}
              className="bg-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-yellow-300 hover:text-teal-950 rounded-lg"
            >
              Cancel
            </button>
            <button 
              disabled={formData.role === ""} 
              type="submit" 
              className="bg-teal-950 hover:bg-yellow-300 text-yellow-300 hover:text-teal-950 px-4 py-2 rounded-lg disabled:opacity-50 "
            >
              {isEditMode ? 'Update Data': 'Add Employee'}
            </button>
          </div>
        </form>

      </div>
  );
}