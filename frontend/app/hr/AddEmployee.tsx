'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeForm from '../components/EmployeeForm';

export default function AddEmployee() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();  
    return (
        <div className="basis-1/3 text-right">
            <button 
                onClick={() =>  setIsOpen(true)}
                className="bg-teal-950 text-yellow-300 p-3 text-sm rounded-xl hover:bg-yellow-300 hover:text-teal-950"
            >
                + Add new employee
            </button>

            {isOpen && (
                <EmployeeForm onSaveSuccess={() => {
                    setIsOpen(false); 
                    router.refresh();
                }} 
                 />
            )}
        </div>
    );
}