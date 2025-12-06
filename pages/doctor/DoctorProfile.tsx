
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Appointment } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { UserCircle, Phone, Mail, MapPin, Star, Calendar, Edit, Wallet, Info } from "lucide-react";
import { Button } from "@/components/Button";

interface Doctor {
    id: string;
    username?: string;
    firstName: string;
    lastName: string;
    specialty?: string;
    rating?: number;
    bio?: string;
    phone?: string;
    email?: string;
    location?: string;
    avatarUrl?: string;
    yearsExperience?: number;
    address?: string;
    isVerified?: boolean;
    consultationPrice?: number;
    source?: string;
    createdAt?: string;
    appointments: any[];
}

export default function DoctorProfile() {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchDoctor = async () => {
            setLoading(true);
            setError(null);
            try {
                // backend returns snake_case fields; fetch raw and map to frontend shape
                const raw: any = await api.get<any>(`/doctors/profile/${user.username}/`);

                const mapped: Doctor = {
                    id: raw.data?._id || String(raw.data?.id || raw.data?._id),
                    username: raw.data?.username,
                    firstName: raw.data?.first_name || raw.data?.firstName || "",
                    lastName: raw.data?.last_name || raw.data?.lastName || "",
                    specialty: raw.data?.specialty || raw.data?.specialty_name || "",
                    rating: raw.data?.rating ?? raw.data?.score ?? 0,
                    bio: raw.data?.bio || "",
                    phone: raw.data?.phone || raw.data?.phone_number || "",
                    email: raw.data?.email || raw.data?.username || "",
                    location: raw.data?.location || raw.data?.location_name || "",
                    address: raw.data?.address || raw.data?.addr || "",
                    avatarUrl: raw.data?.avatar_url || raw.data?.avatarUrl || "",
                    yearsExperience: raw.data?.years_experience ?? raw.data?.yearsExperience,
                    isVerified: raw.data?.is_verified ?? false,
                    consultationPrice: raw.data?.consultation_price ?? raw.data?.consultationPrice,
                    source: raw.data?.source || raw.data?._source || "mongo-enriched",
                    createdAt: raw.data?.created_at || raw.data?.createdAt || "",
                    appointments: raw.data?.appointments || raw.data?.appointment_list || [],
                };
                console.log("Fetched doctor profile:", raw, mapped);
                setDoctor(mapped);
            } catch (err: any) {
                console.error(err);
                setError("Unable to load doctor profile");
            } finally {
                setLoading(false);
            }
        };

        fetchDoctor();
    }, [user]);

    const handleCall = () => {
        if (!doctor?.phone) return;
        window.location.href = `tel:${doctor.phone}`;
    };

    const handleEmail = () => {
        if (!doctor?.email) return;
        window.location.href = `mailto:${doctor.email}`;
    };

    if (loading) return <div className="p-8">Loading doctor profile…</div>;
    if (error || !doctor) return <div className="p-8 text-red-600">{error || "Doctor not found"}</div>;

    return (
        <div className="p-8 max-w-3xl mx-auto">
            {/* HEADER */}
            <div className="mb-8 flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-full text-blue-700">
                    {doctor.avatarUrl ? (
                        <img src={doctor.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                        <UserCircle size={40} />
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Dr. {doctor.firstName} {doctor.lastName}
                    </h2>
                    <p className="text-slate-500 font-medium">{doctor.specialty || "Specialist"}</p>
                    <div className="flex items-center gap-3 mt-2">
                        {doctor.isVerified && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">Verified</span>
                        )}

                        <span className="text-sm text-slate-600">{doctor.yearsExperience ? `${doctor.yearsExperience} yrs exp.` : "—"}</span>

                        {doctor.address ? (
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                <MapPin size={12}/> {doctor.address}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* MAIN CARD */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">

                {/* INFO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* RATING */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-center">
                        <span className="text-slate-400 text-xs block mb-1">Rating</span>
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                            <Star size={18} className="text-yellow-500 fill-current" />
                            {doctor.rating ?? "—"} <span className="text-slate-400 text-xs font-normal">(120 reviews)</span>
                        </div>
                    </div>

                    {/* PRICE */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-center">
                        <span className="text-slate-400 text-xs block mb-1">Consultation Price</span>
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                            <Wallet size={18} className="text-green-600" />
                            {doctor.consultationPrice ? `${doctor.consultationPrice} TND` : "Contact for price"}
                        </div>
                    </div>

                    {/* PHONE */}
                    {doctor.phone && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-400 text-xs block mb-1">Phone</span>
                            <div
                                onClick={handleCall}
                                className="flex items-center gap-2 text-blue-600 font-medium cursor-pointer hover:underline"
                            >
                                <Phone size={16} /> {doctor.phone}
                            </div>
                        </div>
                    )}

                    {/* EMAIL */}
                    {doctor.email && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-slate-400 text-xs block mb-1">Email</span>
                            <div
                                onClick={handleEmail}
                                className="flex items-center gap-2 text-blue-600 font-medium cursor-pointer hover:underline"
                            >
                                <Mail size={16} /> {doctor.email}
                            </div>
                        </div>
                    )}
                </div>

                {/* BIO */}
                <div className="mb-8">
                    <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                        <Info size={20} className="text-blue-500" />
                        About Dr. {doctor.lastName}
                    </h3>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-slate-600 leading-relaxed text-sm">
                        {doctor.bio || "No biography available for this doctor yet."}
                    </div>
                </div>

                {/* EDIT BUTTON */}
                <div className="flex justify-end mb-10">
                    <Button onClick={() => navigate(`/doctor/edit/${doctor.id}`)} variant="secondary">
                        <Edit size={18} className="mr-2" /> Edit Profile
                    </Button>
                </div>

                {/* APPOINTMENTS */}
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-teal-600" />
                    Upcoming Appointments
                </h3>

                <div className="space-y-3">
                    {doctor.appointments?.length > 0 ? (
                        doctor.appointments.map((a: any) => (
                            <div
                                key={a.id}
                                className="p-4 border border-slate-100 rounded-lg bg-slate-50 flex justify-between items-center"
                            >
                                <div>
                                    <div className="font-semibold text-slate-900">{a.patientName}</div>
                                    <div className="text-slate-500 flex items-center gap-2 text-sm mt-1">
                                        <Calendar size={14} />
                                        {a.date || a.appointment_date || a.appointmentDate} • {a.time || a.appointment_time || ''}
                                    </div>
                                </div>

                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                        ${a.status === "upcoming" ? "bg-blue-100 text-blue-700" : 
                                          a.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                >
                                    {a.status}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 bg-slate-50">
                            No appointments found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
