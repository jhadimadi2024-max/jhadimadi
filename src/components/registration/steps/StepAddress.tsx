import React, { useMemo } from 'react';
import { MapPin, Home, Building2, CheckSquare, Square, Compass } from 'lucide-react';
import { RegistrationFormData, AddressData } from '../../../types/registration';
import { 
  getAllDivisions, 
  getDistrictsByDivision, 
  getUpazilasByDistrict 
} from '../../../data/locationMaster';

interface StepAddressProps {
  formData: RegistrationFormData;
  updateFormData: (fields: Partial<RegistrationFormData>) => void;
  errors: Record<string, string>;
}

export const StepAddress: React.FC<StepAddressProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const divisions = useMemo(() => getAllDivisions(), []);

  // Permanent Address Dependent Dropdowns
  const permDistricts = useMemo(() => {
    return getDistrictsByDivision(formData.permanentAddress.division);
  }, [formData.permanentAddress.division]);

  const permUpazilas = useMemo(() => {
    return getUpazilasByDistrict(formData.permanentAddress.district, formData.permanentAddress.division);
  }, [formData.permanentAddress.district, formData.permanentAddress.division]);

  // Present Address Dependent Dropdowns
  const presDistricts = useMemo(() => {
    return getDistrictsByDivision(formData.presentAddress.division);
  }, [formData.presentAddress.division]);

  const presUpazilas = useMemo(() => {
    return getUpazilasByDistrict(formData.presentAddress.district, formData.presentAddress.division);
  }, [formData.presentAddress.district, formData.presentAddress.division]);

  const updatePermanent = (fields: Partial<AddressData>) => {
    const updated = { ...formData.permanentAddress, ...fields };
    if (formData.presentAddressSameAsPermanent) {
      updateFormData({
        permanentAddress: updated,
        presentAddress: updated,
      });
    } else {
      updateFormData({ permanentAddress: updated });
    }
  };

  const updatePresent = (fields: Partial<AddressData>) => {
    updateFormData({
      presentAddress: { ...formData.presentAddress, ...fields },
    });
  };

  const toggleSameAddress = (val: boolean) => {
    if (val) {
      updateFormData({
        presentAddressSameAsPermanent: true,
        presentAddress: { ...formData.permanentAddress },
      });
    } else {
      updateFormData({
        presentAddressSameAsPermanent: false,
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-3">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <span>ঠিকানা ও অবস্থান (Address & Location)</span>
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          সার্ভিস ডেলিভারি, জব ম্যাচিং ও পরিচয় নিশ্চিতকরণে আপনার নির্ভুল স্থায়ী ও বর্তমান ঠিকানা দিন।
        </p>
      </div>

      {/* SECTION 1: PERMANENT ADDRESS */}
      <div className="bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-emerald-700" />
          <h4 className="font-bold text-stone-900 text-sm sm:text-base">স্থায়ী ঠিকানা (Permanent Address)</h4>
        </div>

        {/* Division, District, Upazila in 3-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Division */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              বিভাগ (Division) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.permanentAddress.division}
              onChange={(e) => {
                const newDiv = e.target.value;
                const dists = getDistrictsByDivision(newDiv);
                const firstDist = dists[0]?.nameBn || '';
                const upzs = getUpazilasByDistrict(firstDist, newDiv);
                const firstUpz = upzs[0]?.nameBn || '';
                updatePermanent({
                  division: newDiv,
                  district: firstDist,
                  upazila: firstUpz,
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
            >
              {divisions.map((d) => (
                <option key={d.code} value={d.nameBn}>
                  {d.nameBn} ({d.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              জেলা (District) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.permanentAddress.district}
              onChange={(e) => {
                const newDist = e.target.value;
                const upzs = getUpazilasByDistrict(newDist, formData.permanentAddress.division);
                const firstUpz = upzs[0]?.nameBn || '';
                updatePermanent({
                  district: newDist,
                  upazila: firstUpz,
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
            >
              {permDistricts.map((d) => (
                <option key={d.code} value={d.nameBn}>
                  {d.nameBn} ({d.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Upazila */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              উপজেলা / থানা (Upazila) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.permanentAddress.upazila}
              onChange={(e) => updatePermanent({ upazila: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
            >
              {permUpazilas.map((u) => (
                <option key={u.code} value={u.nameBn}>
                  {u.nameBn} ({u.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Village / Mahalla & Postal Code in 2-col */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              গ্রাম / মহল্লা / বাড়ি নং / রাস্তা <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.permanentAddress.villageOrMahalla}
              onChange={(e) => updatePermanent({ villageOrMahalla: e.target.value })}
              placeholder="উদা: বনরুপা, হাসপাতাল রোড"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
            />
            {errors['permanentAddress.villageOrMahalla'] && (
              <p className="text-xs text-red-600 mt-1">{errors['permanentAddress.villageOrMahalla']}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              পোস্ট কোড (Postal Code)
            </label>
            <input
              type="text"
              value={formData.permanentAddress.postalCode || ''}
              onChange={(e) => updatePermanent({ postalCode: e.target.value })}
              placeholder="উদা: ৪৪০০"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Same as Permanent Address Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => toggleSameAddress(!formData.presentAddressSameAsPermanent)}
          className="flex items-center gap-2.5 text-stone-800 text-sm font-semibold hover:text-emerald-700 transition-colors select-none"
        >
          {formData.presentAddressSameAsPermanent ? (
            <CheckSquare className="w-5 h-5 text-emerald-600" />
          ) : (
            <Square className="w-5 h-5 text-stone-400" />
          )}
          <span>বর্তমান ঠিকানা ও স্থায়ী ঠিকানা একই (Present Address is same as Permanent)</span>
        </button>
      </div>

      {/* SECTION 2: PRESENT ADDRESS (Conditional) */}
      {!formData.presentAddressSameAsPermanent && (
        <div className="bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-stone-900 text-sm sm:text-base">বর্তমান ঠিকানা (Present Address)</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Division */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                বিভাগ (Division) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.presentAddress.division || 'চট্টগ্রাম'}
                onChange={(e) => {
                  const newDiv = e.target.value;
                  const dists = getDistrictsByDivision(newDiv);
                  const firstDist = dists[0]?.nameBn || '';
                  const upzs = getUpazilasByDistrict(firstDist, newDiv);
                  const firstUpz = upzs[0]?.nameBn || '';
                  updatePresent({
                    division: newDiv,
                    district: firstDist,
                    upazila: firstUpz,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              >
                {divisions.map((d) => (
                  <option key={d.code} value={d.nameBn}>
                    {d.nameBn} ({d.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                জেলা (District) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.presentAddress.district || 'খাগড়াছড়ি'}
                onChange={(e) => {
                  const newDist = e.target.value;
                  const upzs = getUpazilasByDistrict(newDist, formData.presentAddress.division);
                  const firstUpz = upzs[0]?.nameBn || '';
                  updatePresent({
                    district: newDist,
                    upazila: firstUpz,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              >
                {presDistricts.map((d) => (
                  <option key={d.code} value={d.nameBn}>
                    {d.nameBn} ({d.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Upazila */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                উপজেলা / থানা (Upazila) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.presentAddress.upazila || 'খাগড়াছড়ি সদর'}
                onChange={(e) => updatePresent({ upazila: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              >
                {presUpazilas.map((u) => (
                  <option key={u.code} value={u.nameBn}>
                    {u.nameBn} ({u.nameEn})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                গ্রাম / মহল্লা / বাড়ি নং / রাস্তা <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.presentAddress.villageOrMahalla || ''}
                onChange={(e) => updatePresent({ villageOrMahalla: e.target.value })}
                placeholder="বর্তমান অবস্থানের গ্রাম বা মহল্লা"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                পোস্ট কোড (Postal Code)
              </label>
              <input
                type="text"
                value={formData.presentAddress.postalCode || ''}
                onChange={(e) => updatePresent({ postalCode: e.target.value })}
                placeholder="উদা: ১২০৫"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
