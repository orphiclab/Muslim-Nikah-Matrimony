"use client";

import { useState, useEffect } from "react";
import { authApi } from "@/services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Calendar } from "lucide-react";

const STEPS = [
  { id: 1, label: "Account Details" },
  { id: 2, label: "Personal Details" },
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
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm outline-none focus:border-[#1B6B4A] focus:ring-2 focus:ring-[#1B6B4A]/20 transition"
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
        <DateField label="Birth Date" name="birthDate" value={data.birthDate || ""} onChange={onChange} />
        <SelectField label="Height" name="height" options={["4'0\"","4'5\"","4'10\"","5'0\"","5'2\"","5'4\"","5'6\"","5'8\"","5'10\"","6'0\"","6'2\"","6'4\"","6'6\""]} value={data.height || ""} onChange={onChange} />
        <SelectField label="Appearance" name="appearance" options={["Very Fair", "Fair", "Wheatish", "Wheatish Brown", "Dark"]} value={data.appearance || ""} onChange={onChange} />
        <SelectField label="Complexion" name="complexion" options={["Very Fair", "Fair", "Medium", "Olive", "Dark"]} value={data.complexion || ""} onChange={onChange} />
        <SelectField label="Ethnicity" name="ethnicity" options={["Arab", "South Asian", "African", "South East Asian", "European", "Other"]} value={data.ethnicity || ""} onChange={onChange} />
        <SelectField label="Dress Code" name="dressCode" options={["Hijab", "Niqab", "Casual Modest", "Islamic Formal", "Traditional"]} value={data.dressCode || ""} onChange={onChange} />
        <SelectField label="Family Status" name="familyStatus" options={["Upper Class", "Upper Middle Class", "Middle Class", "Lower Middle Class"]} value={data.familyStatus || ""} onChange={onChange} />
        <SelectField label="Civil Status" name="civilStatus" options={["Single", "Divorced", "Widowed"]} value={data.civilStatus || ""} onChange={onChange} />
        <SelectField label="Children" name="children" options={["No", "Yes - 1", "Yes - 2", "Yes - 3", "Yes - 3+"]} value={data.children || ""} onChange={onChange} />
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
        <TextField label="First Name" name="firstName" placeholder="Enter your first name" value={data.firstName || ""} onChange={onChange} />
        <TextField label="Last Name" name="lastName" placeholder="Enter your last name" value={data.lastName || ""} onChange={onChange} />
        <TextField label="Email Address" name="email" type="email" placeholder="Enter your email" value={data.email || ""} onChange={onChange} />
        <TextField label="Phone Number" name="phone" type="tel" placeholder="+94 xxx xxx xxx" value={data.phone || ""} onChange={onChange} />
        <TextField label="Password" name="password" type="password" placeholder="Create a password" value={data.password || ""} onChange={onChange} />
        <TextField label="Confirm Password" name="confirmPassword" type="password" placeholder="Confirm your password" value={data.confirmPassword || ""} onChange={onChange} />
      </div>
    </div>
  );
}

function Step3({ data, onChange }: { data: Record<string, string>; onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Location & Education</h2>
      <p className="mt-1 text-sm text-gray-500">Tell us where you are based and your qualifications</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Country" name="country" options={["Sri Lanka", "United Kingdom", "Australia", "Canada", "UAE", "Saudi Arabia", "Qatar", "USA", "Malaysia", "Other"]} value={data.country || ""} onChange={onChange} />
        <SelectField label="State / Province" name="state" options={["Western Province", "Central Province", "Southern Province", "Northern Province", "Eastern Province", "Other"]} value={data.state || ""} onChange={onChange} />
        <TextField label="City" name="city" placeholder="Enter your city" value={data.city || ""} onChange={onChange} />
        <SelectField label="Residency Status" name="residencyStatus" options={["Citizen", "Permanent Resident", "Work Visa", "Student Visa", "Other"]} value={data.residencyStatus || ""} onChange={onChange} />
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
          <SelectField label="Ethnicity" name="fatherEthnicity" options={["Arab","South Asian","African","South East Asian","European","Other"]} value={data.fatherEthnicity || ""} onChange={onChange} />
          <SelectField label="Country" name="fatherCountry" options={["Sri Lanka","United Kingdom","Australia","Canada","UAE","Saudi Arabia","Qatar","USA","Malaysia","Other"]} value={data.fatherCountry || ""} onChange={onChange} />
          <SelectField label="Occupation" name="fatherOccupation" options={["Business","Government Employee","Private Sector","Retired","Not Employed","Deceased"]} value={data.fatherOccupation || ""} onChange={onChange} />
          <TextField label="City" name="fatherCity" placeholder="Enter City" value={data.fatherCity || ""} onChange={onChange} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Mother's Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Ethnicity" name="motherEthnicity" options={["Arab","South Asian","African","South East Asian","European","Other"]} value={data.motherEthnicity || ""} onChange={onChange} />
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
        <label className="text-sm font-medium text-gray-600">Your Expectations</label>
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
export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [lookingFor, setLookingFor] = useState("Male");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect already-logged-in users
  useEffect(() => {
    const token = localStorage.getItem('mn_token');
    if (token) router.replace('/dashboard/parent');
  }, [router]);

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
    if (!formData.email || !formData.password) {
      setError("Email and password are required (Step 1).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await authApi.register({
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });
      localStorage.setItem("mn_token", res.token);
      localStorage.setItem("mn_user", JSON.stringify(res.user));
      // New users must select a package before accessing the dashboard
      router.push('/select-plan');
    } catch (e: any) {
      setError(e.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-poppins bg-gray-50 pt-24 pb-8 px-4 min-h-screen">
      <div className="w-full max-w-5xl mx-auto rounded-2xl bg-white shadow-md overflow-hidden flex flex-col md:flex-row">

        {/* ── Left Sidebar — hidden on mobile ── */}
        <aside className="hidden md:flex w-64 bg-[#F0F4F2] px-7 py-8 flex-col flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Create Account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1B6B4A] font-semibold hover:underline">Log in</Link>
          </p>

          <nav className="mt-6 flex flex-col gap-0">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              const isUpcoming = currentStep < step.id;
              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300 ${
                      isCompleted ? "bg-[#1B6B4A] text-white" : ""
                    } ${
                      isActive ? "bg-[#1B6B4A] text-white" : ""
                    } ${
                      isUpcoming ? "bg-white border-2 border-gray-300 text-gray-400" : ""
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 transition-all duration-300 ${
                        isCompleted ? "bg-[#1B6B4A]" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                  <span className={`pt-0.5 text-sm font-medium transition-all duration-300 ${
                    isActive || isCompleted ? "text-[#1B6B4A]" : "text-gray-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Right Form Area ── */}
        <main className="flex-1 flex flex-col">

          {/* Mobile-only: compact horizontal step progress */}
          <div className="md:hidden bg-[#F0F4F2] px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-800">Create Account</span>
              <span className="text-xs text-[#1B6B4A] font-medium">Step {currentStep} of {STEPS.length}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
              <div
                className="bg-[#1B6B4A] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
            {/* Step dots */}
            <div className="flex items-center justify-between">
              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id;
                const isActive = currentStep === step.id;
                return (
                  <div key={step.id} className="flex flex-col items-center gap-1">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted ? "bg-[#1B6B4A] text-white" : ""
                    } ${
                      isActive ? "bg-[#1B6B4A] text-white ring-2 ring-[#1B6B4A]/30 ring-offset-1" : ""
                    } ${
                      !isCompleted && !isActive ? "bg-white border-2 border-gray-300 text-gray-400" : ""
                    }`}>
                      {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                    </div>
                    <span className={`text-[9px] font-medium text-center leading-tight max-w-[48px] ${
                      isActive || isCompleted ? "text-[#1B6B4A]" : "text-gray-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-[#1B6B4A] font-semibold">Log in</Link>
            </p>
          </div>

          {/* Form Content */}
          <div className="flex-1 px-5 py-6 md:px-8 md:py-8">
            <div className="flex-1">
              {currentStep === 1 && <Step2 data={formData} onChange={handleChange} />}
              {currentStep === 2 && <Step1 data={formData} onChange={handleChange} />}
              {currentStep === 3 && <Step3 data={formData} onChange={handleChange} />}
              {currentStep === 4 && <Step4 data={formData} onChange={handleChange} />}
              {currentStep === 5 && <Step5 data={formData} onChange={handleChange} lookingFor={lookingFor} setLookingFor={setLookingFor} agreedTerms={agreedTerms} setAgreedTerms={setAgreedTerms} />}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  currentStep === 1
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-[#1B6B4A] text-[#1B6B4A] hover:bg-[#1B6B4A]/5 active:scale-95"
                }`}
              >
                Back
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  className="px-7 py-2.5 rounded-xl bg-[#1B6B4A] text-white text-sm font-semibold hover:bg-[#155a3d] active:scale-95 transition-all duration-200 shadow-md"
                >
                  Next
                </button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 w-full">{error}</p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !agreedTerms}
                    className="px-7 py-2.5 rounded-xl bg-[#1B6B4A] text-white text-sm font-semibold hover:bg-[#155a3d] active:scale-95 transition-all duration-200 shadow-md disabled:opacity-60"
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
