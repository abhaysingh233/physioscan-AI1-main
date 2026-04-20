import { useState, useEffect } from 'react';
import { MapPin, Navigation, Phone, Star, ExternalLink, Loader2, AlertCircle, Calendar, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../context/LanguageContext';

interface Doctor {
  name: string;
  specialty: string;
  rating: string | number;
  address: string;
  distance: string;
  phone: string;
  uri: string;
}

interface DoctorResponse {
  doctors: Doctor[];
}

import { generateAIContent } from '../lib/gemini';

interface DoctorFinderProps {
  recommendedSpecialty?: string;
}

export default function DoctorFinder({ recommendedSpecialty }: DoctorFinderProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [result, setResult] = useState<DoctorResponse | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState(recommendedSpecialty || '');

  // Update search query if recommendedSpecialty changes
  useEffect(() => {
    if (recommendedSpecialty) {
      setSearchQuery(recommendedSpecialty);
    }
  }, [recommendedSpecialty]);

  const handleFindDoctors = () => {
    setLoading(true);
    setLocationError(null);
    setResult(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const userQuery = searchQuery || "hospitals and clinics";
          const prompt = `
Find ${userQuery} near the provided location (lat: ${position.coords.latitude}, long: ${position.coords.longitude}).
Using the Google Maps tool, retrieve real details.

Return a STRICT JSON array of the top 4-5 results. 
Each object in the array must have:
- "name": Name of the hospital/clinic/doctor
- "specialty": inferred specialty (e.g., "General Hospital", "Cardiologist", "Dental Clinic")
- "rating": numeric rating (e.g., 4.5) or "N/A" if not found
- "address": address or vicinity
- "distance": estimated distance string (e.g., "1.2 km") - estimate if not precise
- "phone": phone number if available, else "N/A"

Do not include markdown formatting (no \`\`\`json). Just the raw JSON array.
`;

          const response = await generateAIContent(prompt, false, "gemini-3-flash-preview", {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
              },
            },
          });

          let doctors = [];
          try {
            const { cleanAndParseJSON } = await import('../lib/gemini');
            doctors = cleanAndParseJSON(response.text || "[]");
          } catch (e) {
            console.error("Failed to parse doctors JSON", e);
          }

          setResult({ doctors });
        } catch (err) {
          setLocationError('Failed to fetch doctor information. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = 'Unable to retrieve your location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable location access to find nearby doctors.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'The request to get user location timed out.';
        }
        setLocationError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setBookingSuccess(false);
  };

  const confirmBooking = () => {
    // Simulate API call
    setTimeout(() => {
      setBookingSuccess(true);
      setTimeout(() => {
        setSelectedDoctor(null);
        setBookingSuccess(false);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      {/* Control Section */}
      <div className="lg:col-span-4 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t('find_care')}</h2>
          </div>

          <p className="text-slate-600 mb-6 leading-relaxed">
            {t('locate_text')}
          </p>

          <div className="mb-6">
            <label htmlFor="doctor-search" className="block text-sm font-semibold text-slate-700 mb-2">
              {t('search_specialist')}
            </label>
            <input
              type="text"
              id="doctor-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Cardiologist, Dentist, ENT..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-slate-50 hover:bg-white"
            />
          </div>

          <button
            onClick={handleFindDoctors}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('locating')}</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                <span>{t('find_doctors_btn')}</span>
              </>
            )}
          </button>

          {locationError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{locationError}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            {t('quick_tip')}
          </h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            {t('quick_tip_text')}
          </p>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8">
        {result && result.doctors && result.doctors.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-4"
          >
            {result.doctors.map((doctor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/40 transition-all group flex flex-col sm:flex-row gap-5"
              >
                {/* Doctor Info */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {doctor.name}
                    </h4>
                    {doctor.rating !== 'N/A' && (
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200/50">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {doctor.rating}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-blue-600 font-semibold text-sm mb-4 bg-blue-50 inline-block px-3 py-1 rounded-full">{doctor.specialty}</p>
                  
                  <div className="space-y-2.5 text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                      <span className="leading-relaxed">{doctor.address} <span className="font-semibold text-slate-900">({doctor.distance})</span></span>
                    </div>
                    {doctor.phone !== 'N/A' && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 flex-shrink-0 text-slate-400" />
                        <span className="font-medium">{doctor.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-auto">
                    <button
                      onClick={() => handleBookAppointment(doctor)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98]"
                    >
                      <Calendar className="w-4 h-4" />
                      {t('book_appointment')}
                    </button>
                    
                    <a
                      href={`tel:${doctor.phone}`}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                        doctor.phone === 'N/A' 
                          ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-sm'
                      }`}
                      onClick={(e) => doctor.phone === 'N/A' && e.preventDefault()}
                    >
                      <Phone className="w-4 h-4" />
                      {t('call')}
                    </a>

                    <a
                      href={doctor.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Navigation className="w-4 h-4" />
                      {t('directions')}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : result ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 min-h-[500px] border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('no_doctors_found')}</h3>
            <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
              {t('no_doctors_text')}
            </p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 min-h-[500px] border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('locate_medical_help')}</h3>
            <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
              {t('locate_help_text')}
            </p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">{t('book_appointment')}</h3>
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                {bookingSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-3">{t('booking_confirmed')}</h4>
                    <p className="text-slate-600 leading-relaxed max-w-xs mx-auto">
                      {t('booking_text').replace('{doctor}', selectedDoctor.name)}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-5">
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 mb-6">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">{t('doctor_label')}</p>
                      <p className="text-lg font-bold text-slate-900">{selectedDoctor.name}</p>
                      <p className="text-sm font-medium text-slate-600 mt-1">{selectedDoctor.specialty}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{t('preferred_date')}</label>
                      <input type="date" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 hover:bg-white" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{t('reason_visit')}</label>
                      <textarea className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none transition-all bg-slate-50 hover:bg-white" placeholder={t('reason_placeholder')}></textarea>
                    </div>

                    <button
                      onClick={confirmBooking}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all mt-6 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98]"
                    >
                      {t('confirm_booking')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
