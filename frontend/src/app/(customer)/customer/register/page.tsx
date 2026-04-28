"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Calendar } from "lucide-react";
import { loadMasterData, type MasterData } from "@/app/admin/master-file/data";

const STEPS = [
  { id: 1, label: "Personal Details" },
  { id: 2, label: "Account Details" },
  { id: 3, label: "Location & Education" },
  { id: 4, label: "Family Details" },
  { id: 5, label: "Additional Details" },
];

/* ─── Reusable Field Components ─── */
function SelectField({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition"
        >
          <option value="">{`Select ${label}`}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

function TextField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition"
      />
    </div>
  );
}

function DateField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="relative">
        <input
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

/* ─── Step Forms ─── */
function Step1({ data, onChange }: { data: Record<string, string>; onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Your Personal Details</h2>
      <p className="mt-1 text-sm text-gray-500">Please provide your basic information</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Created By" name="createdBy" options={["Self", "Parent", "Guardian", "Sibling"]} value={data.createdBy || ""} onChange={onChange} />
        <SelectField label="Gender" name="gender" options={["Male", "Female"]} value={data.gender || ""} onChange={onChange} />
        <DateField label="Date Of Birth" name="birthDate" value={data.birthDate || ""} onChange={onChange} />
        <SelectField label="Height" name="height" options={["4'0\"","4'5\"","4'10\"","5'0\"","5'2\"","5'4\"","5'6\"","5'8\"","5'10\"","6'0\"","6'2\"","6'4\"","6'6\""]} value={data.height || ""} onChange={onChange} />
        <SelectField label="Appearance" name="appearance" options={["Very Fair", "Fair", "Wheatish", "Wheatish Brown", "Dark"]} value={data.appearance || ""} onChange={onChange} />
        <SelectField label="Complexion" name="complexion" options={["Very Fair", "Fair", "Medium", "Olive", "Dark"]} value={data.complexion || ""} onChange={onChange} />
        <SelectField label="Ethnicity" name="ethnicity" options={["Muslim", "Sri Lankan Moors", "Indian Moors", "Malays", "Indian Malays", "Arab (Middle Eastern)", "Tamil", "Indian", "Memons", "Turkish", "European", "Other"]} value={data.ethnicity || ""} onChange={onChange} />
        <SelectField label="Dress Code" name="dressCode" options={["Hijab", "Niqab", "Casual Modest", "Islamic Formal", "Traditional"]} value={data.dressCode || ""} onChange={onChange} />
        <SelectField label="Family Status" name="familyStatus" options={["Upper Class", "Upper Middle Class", "Middle Class", "Lower Middle Class"]} value={data.familyStatus || ""} onChange={onChange} />
        <SelectField label="Civil Status" name="civilStatus" options={["Single", "Divorced", "Widowed"]} value={data.civilStatus || ""} onChange={onChange} />
      </div>
    </div>
  );
}

function Step2({ data, onChange }: { data: Record<string, string>; onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Account Details</h2>
      <p className="mt-1 text-sm text-gray-500">Set up your login credentials</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Email Address" name="email" type="email" placeholder="Enter your email" value={data.email || ""} onChange={onChange} />
        <TextField label="Phone Number" name="phone" type="tel" placeholder="+94 xxx xxx xxx" value={data.phone || ""} onChange={onChange} />
        <TextField label="Password" name="password" type="password" placeholder="Create a password" value={data.password || ""} onChange={onChange} />
        <TextField label="Confirm Password" name="confirmPassword" type="password" placeholder="Confirm your password" value={data.confirmPassword || ""} onChange={onChange} />
      </div>
    </div>
  );
}

function Step3({
  data,
  onChange,
  masterData,
}: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  masterData: MasterData;
}) {
  // Derive city lists from masterfile
  const countryNames = masterData.countries.map((c) => c.name);

  const residentCountryObj = masterData.countries.find(
    (c) => c.name === data.residentCountry
  );
  const residentCityOptions = residentCountryObj
    ? residentCountryObj.cities.map((ci) => ci.name)
    : [];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Location &amp; Education</h2>
      <p className="mt-1 text-sm text-gray-500">Tell us where you are based and your qualifications</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Country" name="country" options={["Sri Lanka", "United Kingdom", "Australia", "Canada", "UAE", "Saudi Arabia", "Qatar", "USA", "Malaysia", "Other"]} value={data.country || ""} onChange={onChange} />
        <SelectField label="State / Province" name="state" options={["Western Province", "Central Province", "Southern Province", "Northern Province", "Eastern Province", "Other"]} value={data.state || ""} onChange={onChange} />
        <TextField label="City" name="city" placeholder="Enter your city" value={data.city || ""} onChange={onChange} />
        <SelectField label="Residency Status" name="residencyStatus" options={["Citizen", "Permanent Resident", "Work Visa", "Student Visa", "Other"]} value={data.residencyStatus || ""} onChange={onChange} />

        {/* ── Resident Country & City (from masterfile) ── */}
        <SelectField
          label="Resident Country"
          name="residentCountry"
          options={countryNames}
          value={data.residentCountry || ""}
          onChange={onChange}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">
            Resident City
          </label>
          <div className="relative">
            <select
              name="residentCity"
              value={data.residentCity || ""}
              onChange={onChange}
              disabled={residentCityOptions.length === 0}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {residentCityOptions.length === 0
                  ? "Select Resident Country first"
                  : "Select Resident City"}
              </option>
              {residentCityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <SelectField label="Education" name="education" options={["High School","Diploma","Bachelor's Degree","Master's Degree","Doctorate (PhD)","Other"]} value={data.education || ""} onChange={onChange} />
        <TextField label="Field of Study" name="fieldOfStudy" placeholder="e.g. Computer Science" value={data.fieldOfStudy || ""} onChange={onChange} />
        <SelectField label="Occupation" name="occupation" options={["Employed","Self Employed","Business Owner","Student","Not Employed"]} value={data.occupation || ""} onChange={onChange} />
        <TextField label="Profession / Job Title" name="profession" placeholder="e.g. Software Engineer" value={data.profession || ""} onChange={onChange} />
      </div>
    </div>
  );
}

function Step4({ data, onChange }: { data: Record<string, string>; onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Family Details</h2>
      <p className="mt-1 text-sm text-gray-500">Information about your family</p>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Father's Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Ethnicity" name="fatherEthnicity" options={["Muslim","Sri Lankan Moors","Indian Moors","Malays","Indian Malays","Arab (Middle Eastern)","Tamil","Indian","Memons","Turkish","European","Other"]} value={data.fatherEthnicity || ""} onChange={onChange} />
          <SelectField label="Country" name="fatherCountry" options={["Sri Lanka","United Kingdom","Australia","Canada","UAE","Saudi Arabia","Qatar","USA","Malaysia","Other"]} value={data.fatherCountry || ""} onChange={onChange} />
          <SelectField label="Occupation" name="fatherOccupation" options={["Business","Government Employee","Private Sector","Retired","Not Employed","Deceased"]} value={data.fatherOccupation || ""} onChange={onChange} />
          <TextField label="City" name="fatherCity" placeholder="Enter City" value={data.fatherCity || ""} onChange={onChange} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Mother's Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Ethnicity" name="motherEthnicity" options={["Muslim","Sri Lankan Moors","Indian Moors","Malays","Indian Malays","Arab (Middle Eastern)","Tamil","Indian","Memons","Turkish","European","Other"]} value={data.motherEthnicity || ""} onChange={onChange} />
          <SelectField label="Country" name="motherCountry" options={["Sri Lanka","United Kingdom","Australia","Canada","UAE","Saudi Arabia","Qatar","USA","Malaysia","Other"]} value={data.motherCountry || ""} onChange={onChange} />
          <SelectField label="Occupation" name="motherOccupation" options={["Business","Government Employee","Private Sector","Homemaker","Retired","Not Employed"]} value={data.motherOccupation || ""} onChange={onChange} />
          <TextField label="City" name="motherCity" placeholder="Enter City" value={data.motherCity || ""} onChange={onChange} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Sibling's Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Number of Brothers</label>
            <input type="number" name="brothers" min="0" max="20" value={data.brothers || "0"} onChange={onChange}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Number of Sisters</label>
            <input type="number" name="sisters" min="0" max="20" value={data.sisters || "0"} onChange={onChange}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step5({ data, onChange, lookingFor, setLookingFor, agreedTerms, setAgreedTerms }: {
  data: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => void;
  lookingFor: string;
  setLookingFor: (v: string) => void;
  agreedTerms: boolean;
  setAgreedTerms: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Additional Details</h2>
      <p className="mt-1 text-sm text-gray-500">Tell us more about yourself</p>

      <div className="mt-6 flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Additional Information</label>
        <textarea
          name="about"
          value={data.about || ""}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={4}
          placeholder="Tell us more about yourself....."
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition resize-none"
        />
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Tell us more about Expectations</label>
        <textarea
          name="expectations"
          value={data.expectations || ""}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={4}
          placeholder="What are you looking for in partner......"
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition resize-none"
        />
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium text-gray-600 block mb-2">I Am Looking For</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLookingFor("Male")}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
              lookingFor === "Male"
                ? "border-[#1B6B4A] bg-[#1B6B4A]/10 text-[#1B6B4A]"
                : "border-gray-200 text-gray-500 hover:border-[#1B6B4A]/40"
            }`}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            Male
          </button>
          <button
            type="button"
            onClick={() => setLookingFor("Female")}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
              lookingFor === "Female"
                ? "border-[#1B6B4A] bg-[#1B6B4A]/10 text-[#1B6B4A]"
                : "border-gray-200 text-gray-500 hover:border-[#1B6B4A]/40"
            }`}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            Female
          </button>
        </div>
      </div>

      <label className="mt-5 flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedTerms}
          onChange={(e) => setAgreedTerms(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-[#1B6B4A]"
        />
        <span className="text-sm text-gray-500">
          I agree and accept the{" "}
          <Link href="/terms" className="text-[#1B6B4A] font-medium hover:underline">terms and conditions</Link>
        </span>
      </label>
    </div>
  );
}

/* ─── Main Page ─── */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [lookingFor, setLookingFor] = useState("Male");
  const [masterData, setMasterData] = useState<MasterData>(loadMasterData());

  useEffect(() => {
    setMasterData(loadMasterData());
  }, []);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!agreedTerms) {
      setError("Please accept the terms and conditions to continue.");
      return;
    }
    if (!formData.email || !formData.password) {
      setError("Email and password are required (Step 2).");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match (Step 2).");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Step 1: Register the user account
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok || !regData.success) {
        setError(regData.message ?? "Registration failed. Please try again.");
        return;
      }
      const token: string = regData.token;
      localStorage.setItem("mn_token", token);
      localStorage.setItem("mn_user", JSON.stringify(regData.user));

      // Step 2: Create child profile with the personal details
      const name = 'Profile';
      const gender = formData.gender?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE";
      const dateOfBirth = formData.birthDate || new Date(Date.now() - 25 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      await fetch(`${API_URL}/profile/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          gender,
          dateOfBirth,
          city: formData.city || undefined,
          country: formData.country || undefined,
          education: formData.education || undefined,
          occupation: formData.occupation || undefined,
          about: formData.about || undefined,
        }),
      });

      // Redirect to plan selection
      router.push("/select-plan");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-poppins min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* ── Left Sidebar ── */}
        <aside className="w-full md:w-72 bg-[#F0F4F2] px-8 py-10 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-full bg-[#1B6B4A] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </div>
            <span className="font-bold text-[#1B6B4A] text-base tracking-wide uppercase">Muslim Nikah</span>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-800">Create Account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1B6B4A] font-medium hover:underline">
              Log in
            </Link>
          </p>

          {/* Step Indicators */}
          <nav className="mt-8 flex flex-col gap-0">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              const isUpcoming = currentStep < step.id;

              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300
                        ${isCompleted ? "bg-[#1B6B4A] text-white" : ""}
                        ${isActive ? "bg-[#1B6B4A] text-white" : ""}
                        ${isUpcoming ? "bg-white border-2 border-gray-300 text-gray-400" : ""}
                      `}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 transition-all duration-300 ${
                          isCompleted ? "bg-[#1B6B4A]" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`pt-0.5 text-sm font-medium transition-all duration-300 ${
                      isActive || isCompleted ? "text-[#1B6B4A]" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Right Form Area ── */}
        <main className="flex-1 px-8 py-10 flex flex-col">
          <div className="flex-1">
            {currentStep === 1 && <Step1 data={formData} onChange={handleChange} />}
            {currentStep === 2 && <Step2 data={formData} onChange={handleChange} />}
            {currentStep === 3 && <Step3 data={formData} onChange={handleChange} masterData={masterData} />}
            {currentStep === 4 && <Step4 data={formData} onChange={handleChange} />}
            {currentStep === 5 && <Step5 data={formData} onChange={handleChange} lookingFor={lookingFor} setLookingFor={setLookingFor} agreedTerms={agreedTerms} setAgreedTerms={setAgreedTerms} />}
          </div>

          {/* Error message */}
          {error && currentStep === 5 && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                currentStep === 1 || loading
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-[#1B6B4A] text-[#1B6B4A] hover:bg-[#1B6B4A]/5"
              }`}
            >
              Back
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="px-8 py-2.5 rounded-lg bg-[#1B6B4A] text-white text-sm font-semibold hover:bg-[#155a3d] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 rounded-lg bg-[#1B6B4A] text-white text-sm font-semibold hover:bg-[#155a3d] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 flex items-center gap-2"
              >
                {loading && (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {loading ? "Creating Account…" : "Create Account"}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
