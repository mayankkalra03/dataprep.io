import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { faker } from '@faker-js/faker';
import { saveAs } from 'file-saver';

// --- Configuration Constants ---
const CLASSES = [
  "Full-Time Salaried",
  "Full-Time Hourly",
  "Part-Time Salaried",
  "Part-Time Hourly"
];

const STATIC_ADDRESS = {
  line1: "1 Main Street",
  city: "Hartford",
  zip: "06106",
  state: "Connecticut"
};

const HOUSEHOLD_OPTIONS = [
  "Employee Only",
  "Employee + Spouse",
  "Employee + Spouse + Child"
];

const BG_IMAGE_URL = "https://images.unsplash.com/photo-1643295054171-faf3f2491ecb";

// --- Helper Functions ---

const generateSSN = () => {
  let area = "";
  let group = "";
  let serial = "";

  // 1. Generate Area (First 3): Starts with 5, 6, 7. Cannot be 666.
  do {
    area = faker.helpers.arrayElement(['5', '6', '7']) + faker.string.numeric(2);
  } while (area === "666");

  // 2. Generate Group (Middle 2): Cannot be "00"
  do {
    group = faker.string.numeric(2);
  } while (group === "00");

  // 3. Generate Serial (Last 4): Cannot be "0000"
  do {
    serial = faker.string.numeric(4);
  } while (serial === "0000");

  return `${area}-${group}-${serial}`;
};

// Generate Unique Random EEID (6 digits)
const generateUniqueEEID = (usedIds) => {
  let id;
  do {
    id = faker.string.numeric(6); // Generate random 6-digit ID
  } while (usedIds.has(id));      // Retry if it already exists
  usedIds.add(id);
  return id;
};

const getAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const formatDate = (dateObj) => {
  if (!dateObj) return "";
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const getTimestamp = () => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${mm}${dd}${yyyy}${hh}${min}`;
};

const createRow = (eeId, type, memberType, lastName, firstName) => {
  const isEmployee = memberType === "Employee";

  let dob;
  if (isEmployee || memberType === "Spouse") {
    dob = faker.date.birthdate({ min: 22, max: 60, mode: 'age' });
  } else {
    dob = faker.date.birthdate({ min: 0, max: 25, mode: 'age' });
  }

  const dobStr = formatDate(dob);
  const age = getAge(dob);

  let email = "";
  if (isEmployee) {
    const cleanFirst = firstName.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const cleanLast = lastName.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const randomDigits = faker.string.numeric(3);
    email = `${cleanFirst}${cleanLast}${randomDigits}@yopmail.com`;
  }

  return [
    "", eeId, lastName, memberType === "Employee" ? firstName : faker.person.firstName(),
    email, memberType, generateSSN(), dobStr, age,
    faker.person.sex().toUpperCase() === 'FEMALE' ? 'F' : 'M',
    "N", isEmployee ? "01/01/2023" : "",
    isEmployee ? faker.number.int({ min: 50000, max: 90000 }) : "",
    isEmployee ? faker.helpers.arrayElement(CLASSES) : "",
    STATIC_ADDRESS.line1, "", STATIC_ADDRESS.city, STATIC_ADDRESS.zip, STATIC_ADDRESS.state,
    "yes", "no", "", "", ""
    // isEmployee ? faker.number.float({ min: 400, max: 1200, precision: 0.01 }).toFixed(2) : "",
    // isEmployee ? faker.number.float({ min: 450, max: 1300, precision: 0.01 }).toFixed(2) : ""
  ];
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [config, setConfig] = useState({
    numSheets: 1,
    numHouseholds: 5,
    householdType: "Employee Only"
  });


  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleGenerate = async () => {
    setLoading(true);
    const timestamp = getTimestamp();
    const usedIds = new Set();

    for (let i = 0; i < config.numSheets; i++) {
      const rows = [];
      rows.push([""]);
      rows.push(["", `Presented to: Apex Global Solutions`]);
      rows.push([""]);
      rows.push([""]);
      rows.push([
        "", "EE ID", "Last Name", "First Name", "Email", "Member Type", "SSN",
        "Date of Birth", "Age", "Gender", "Disabled", "Date of Hire",
        "Annual Household Income", "Class Name", "Address Line 1",
        "Apt/Floor # Line 2", "City", "Zip Code", "State",
        "Mailing Same as Home (yes/no)", "Paperless (yes/no)",
        "Contribution Start Date", "Current Group Plan Premium",
        "Renewal Group Plan Premium"
      ]);

      for (let h = 0; h < config.numHouseholds; h++) {
        const eeId = generateUniqueEEID(usedIds);
        const lastName = faker.person.lastName();
        const firstName = faker.person.firstName();

        rows.push(createRow(eeId, config.householdType, "Employee", lastName, firstName));

        if (config.householdType.includes("Spouse")) {
          rows.push(createRow(eeId, config.householdType, "Spouse", lastName));
        }

        if (config.householdType.includes("Child")) {
          const childCount = faker.number.int({ min: 1, max: 2 });
          for (let c = 0; c < childCount; c++) {
            rows.push(createRow(eeId, config.householdType, "Child", lastName));
          }
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wscols = [
        { wch: 2 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 12 }, { wch: 15 },
        { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }
      ];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Worksheet");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `CensusFile_${timestamp}.xlsx`);
      await new Promise(r => setTimeout(r, 500));
    }
    setLoading(false);
  };

  const setSheets = (val) => {
    let v = parseInt(val);
    if (isNaN(v)) v = 1;
    if (v > 5) v = 5;
    if (v < 1) v = 1;
    setConfig({ ...config, numSheets: v });
  };

  const setHouseholds = (val) => {
    let v = parseInt(val);
    if (isNaN(v)) v = 1;
    if (v > 10) v = 10;
    if (v < 1) v = 1;
    setConfig({ ...config, numHouseholds: v });
  };

  return (
    <div className={`flex flex-col min-h-screen font-sans transition-colors duration-300 relative overflow-hidden
      ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>

      {/* --- Muted Background Image --- */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out opacity-100"
        style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
      />
      <div className={`fixed inset-0 z-0 transition-colors duration-300 
        ${darkMode ? 'bg-slate-900/90' : 'bg-white/80'}`}></div>

      {/* --- Header --- */}
      <header className={`relative z-10 w-full px-6 py-4 flex justify-between items-center border-b backdrop-blur-md shadow-sm
         ${darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/60'}`}>

        <div className="flex items-center gap-2 group cursor-pointer select-none">

          <div className={`p-2 rounded-lg text-white shadow-md bg-[#50C5BC] 
            transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
            group-hover:rotate-[360deg] group-hover:scale-110 group-hover:shadow-[0_0_15px_#50C5BC]`}>
            <img src="/favicon.png" alt="DataPrep.io" width="24" height="24" />
          </div>

          <div className="flex items-baseline">
            <span className="font-bold text-xl tracking-tight">DataPrep</span>
            <span className={`font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#50C5BC] to-[#50C5BC] 
              group-hover:from-[#50C5BC] group-hover:to-cyan-400 
              transition-all duration-300 ease-out pl-0.5`}>
              .io
            </span>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full transition-all duration-200 
            ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          title="Toggle Theme"
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" /><path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          )}
        </button>
      </header>

      {/* --- Main Content --- */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-4">
        <div className={`w-full max-w-lg p-6 md:p-10 rounded-3xl shadow-2xl transition-all duration-300 border backdrop-blur-md
          ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 border-white/60'}`}>

          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Generate Dataset</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Instant PII-compliant test data for enrollment workflows.
              <span className={`ml-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border opacity-80
            ${darkMode ? 'border-[#50C5BC]/40 text-[#50C5BC] bg-[#50C5BC]/10' : 'border-[#50C5BC]/40 text-[#50C5BC] bg-[#50C5BC]/5'}
            animate-pulse`}>
                BETA
              </span>
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 items-end">

              {/* Input: Files */}
              <div className="group">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Files (Max 5)
                </label>
                <input
                  type="number"
                  value={config.numSheets}
                  onChange={(e) => setSheets(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl outline-none border-2 transition-all font-semibold text-lg text-left
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-[#50C5BC]
                    ${darkMode
                      ? 'bg-slate-700/50 border-slate-600 text-white focus:bg-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'}`}
                />
              </div>

              {/* Input: Households */}
              <div className="group">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Households (Max 10)
                </label>
                <input
                  type="number"
                  value={config.numHouseholds}
                  onChange={(e) => setHouseholds(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl outline-none border-2 transition-all font-semibold text-lg text-left
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-[#50C5BC]
                    ${darkMode
                      ? 'bg-slate-700/50 border-slate-600 text-white focus:bg-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'}`}
                />
              </div>
            </div>

            <div className="group" ref={dropdownRef}>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Composition
              </label>
              <div className="relative">
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all font-medium cursor-pointer flex justify-between items-center select-none
                    ${isDropdownOpen ? 'border-[#50C5BC]' : ''}
                    ${darkMode
                      ? `bg-slate-700/50 border-slate-600 text-white`
                      : `bg-slate-50 border-slate-200 text-slate-800`}`}
                >
                  <span className="truncate mr-2">{config.householdType}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </div>

                {isDropdownOpen && (
                  <div className={`absolute z-20 w-full mt-2 rounded-xl shadow-xl overflow-hidden border animate-in fade-in zoom-in-95 duration-100
                    ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-100'}`}>
                    {HOUSEHOLD_OPTIONS.map((option) => (
                      <div
                        key={option}
                        onClick={() => {
                          setConfig({ ...config, householdType: option });
                          setIsDropdownOpen(false);
                        }}
                        className={`px-4 py-3 cursor-pointer transition-colors text-sm font-medium border-l-4
                          ${config.householdType === option
                            ? (darkMode ? 'border-[#50C5BC] bg-[#50C5BC]/20 text-[#50C5BC]' : 'border-[#50C5BC] bg-[#50C5BC]/10 text-[#50C5BC]')
                            : (darkMode ? 'border-transparent text-slate-300 hover:bg-slate-700' : 'border-transparent text-slate-600 hover:bg-slate-50')
                          }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform transition-all flex items-center justify-center gap-2
                ${loading
                  ? 'bg-slate-400 cursor-not-allowed translate-y-0 opacity-70'
                  : 'bg-[#50C5BC] hover:bg-[#3daea6]'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Generate Files'}
            </button>
          </div>
        </div>
      </main>

    </div>
  );
}