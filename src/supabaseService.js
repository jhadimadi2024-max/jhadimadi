import { supabase } from './supabase';

// ১. যেকোনো ফর্মে সাবমিট করা ডেটা ও ছবি Supabase-এ পাঠানোর ফাংশন
export async function submitToJhadimadi(tableName, formData, imageFile, bucketName) {
  let photoUrl = '';

  // যদি ছবি বা ফাইল দেওয়া হয়, তবে তা Supabase Storage-এ আপলোড হবে
  if (imageFile) {
    const fileName = `${tableName}/${Date.now()}_${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error("Storage Upload Error:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    photoUrl = data.publicUrl;
  }

  // ছবির লিংকটি ডেটা অবজেক্টের সাথে যুক্ত করা
  const finalData = { ...formData };
  if (tableName === 'profiles') finalData.photo_url = photoUrl;
  if (tableName === 'products') finalData.image_url = photoUrl;

  // ডেটাবেজ টেবিলে ডেটা পার্মানেন্টলি সেভ করা
  const { error: insertError } = await supabase
    .from(tableName)
    .insert([finalData]);

  if (insertError) {
    console.error("Database Insert Error:", insertError);
    throw insertError;
  }

  return "সফলভাবে সংরক্ষিত হয়েছে!";
}

// ২. উপজেলা ও ক্যাটাগরি বা নাম দিয়ে সার্চ করার লজিক
export async function searchJhadimadiData(tableName, selectedUpazila, searchTerm) {
  let query = supabase.from(tableName).select('*');

  // যদি উপজেলা সিলেক্ট করা থাকে
  if (selectedUpazila && selectedUpazila !== 'all') {
    query = query.eq('upazila', selectedUpazila);
  }

  // যদি সার্চ বারে কিছু লেখা হয় (যেমন: প্রোডাক্টের নাম, পেশা বা ব্লাড গ্রুপ)
  if (searchTerm) {
    if (tableName === 'profiles') {
      query = query.or(`full_name.ilike.%${searchTerm}%,profession.ilike.%${searchTerm}%,blood_group.ilike.%${searchTerm}%`);
    } else if (tableName === 'products') {
      query = query.or(`name_bn.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("Search Error:", error);
    return [];
  }
  return data;
}