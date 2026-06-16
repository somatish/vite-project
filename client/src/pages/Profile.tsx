import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import type { ProfileFormData } from "../types";
import Card from "../components/ui/Card";
import { Calendar, Camera, Eye, LogOutIcon, Scale, Target, User, X } from "lucide-react";
import Button from "../components/ui/Button";
import { goalLabels, goalOptions } from "../assets/assets";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import toast from "react-hot-toast";
import api from "../configs/api";

const Profile = () => {
  const { user, logout, fetchUser, allFoodLogs, allActivityLogs } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    age: 0,
    weight: 0,
    height: 0,
    goal: "maintain",
    dailyCalorieIntake: 2000,
    dailyCalorieBurn: 400,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // FIX 1: Changed state types from 'null' to 'undefined' for full tsc compliance
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // FIX 2: Replaced the 'null' fallback with 'undefined'
  const profilePhotoUrl = user?.profilePhoto?.url
    ? user.profilePhoto.url.startsWith("http")
      ? user.profilePhoto.url
      : `${import.meta.env.VITE_STRAPI_API_URL}${user.profilePhoto.url}`
    : undefined;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowPhotoModal(false);

    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingPhoto(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append("files", file);
      const { data: uploaded } = await api.post("/api/upload", uploadForm, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await api.put(`/api/users/${user?.id}`, { profilePhoto: uploaded[0]?.id });
      await fetchUser(user?.token || "");
      setPhotoPreview(undefined);
      toast.success("Profile photo updated!");
    } catch (err: any) {
      console.log(err);
      toast.error(err?.message || "Failed to update photo");
      setPhotoPreview(undefined);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const fetchUserData = () => {
    if (user) {
      setFormData({
        age: user?.age || 0,
        weight: user?.weight || 0,
        height: user?.height || 0,
        goal: user?.goal || "maintain",
        dailyCalorieIntake: user?.dailyCalorieIntake || 2000,
        dailyCalorieBurn: user?.dailyCalorieBurn || 400,
      });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    try {
      await api.put(`/api/users/${user?.id}`, formData);
      await fetchUser(user?.token || "");
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.log(error);
      toast.error(error?.message || "Failed to update profile");
    }
    setIsEditing(false);
  };

  const getStats = () => {
    const totalFooEntries = allFoodLogs.length || 0;
    const totalActivities = allActivityLogs.length || 0;
    return { totalFooEntries, totalActivities };
  };

  const stats = getStats();

  if (!user || !formData) return null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your profile</p>
      </div>

      <div className="profile-content">
        {/* Left Column */}
        <Card>
          {/* Card Title */}
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div
              className="relative group cursor-pointer flex-shrink-0"
              onClick={() => (isEditing ? fileInputRef.current?.click() : setShowPhotoModal(true))}
            >
              <div className="size-16 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-2 ring-emerald-500/30">
                {photoPreview || profilePhotoUrl ? (
                  <img src={photoPreview || profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="size-8 text-white" />
                )}
              </div>

              {isUploadingPhoto ? (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? <Camera className="size-5 text-white" /> : <Eye className="size-5 text-white" />}
                </div>
              )}

              {/* FIX 3: Removed the broken stray 'setIsEditing(false)' statement from here */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Username */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{user?.username}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Member Since {new Date(user?.createdAt || "").toLocaleDateString()}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                {isEditing ? "Tap photo to change" : "Tap to view"}
              </p>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Age"
                type="number"
                value={formData.age}
                onChange={(v) => setFormData({ ...formData, age: Number(v) })}
                min={12}
                max={120}
              />
              <Input
                label="Weight"
                type="number"
                value={formData.weight}
                onChange={(v) => setFormData({ ...formData, weight: Number(v) })}
                min={20}
                max={300}
              />
              <Input
                label="Height"
                type="number"
                value={formData.height}
                onChange={(v) => setFormData({ ...formData, height: Number(v) })}
                min={100}
                max={250}
              />
              <Select
                label="Fitness Goal"
                value={formData.goal as string}
                onChange={(v) => setFormData({ ...formData, goal: v as "lose" | "maintain" | "gain" })}
                options={goalOptions}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      age: Number(user.age),
                      weight: Number(user.weight),
                      height: Number(user.height),
                      // FIX 4: Replaced invalid empty string fallback with a strict typed default
                      goal: user.goal || "maintain",
                      dailyCalorieIntake: user.dailyCalorieIntake || 2000,
                      dailyCalorieBurn: user.dailyCalorieBurn || 400,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {/* Age */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors duration-200">
                  <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Calendar className="size-4.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Age</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{user.age} years</p>
                  </div>
                </div>

                {/* Weight */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors duration-200">
                  <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Scale className="size-4.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Weight</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{user.weight} kg</p>
                  </div>
                </div>

                {/* Height */}
                {user.height !== 0 && (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors duration-200">
                    <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <User className="size-4.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Height</p>
                      <p className="font-semibold text-slate-800 dark:text-white">{user.height} cm</p>
                    </div>
                  </div>
                )}

                {/* Goal */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors duration-200">
                  <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <Target className="size-4.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Goal</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{goalLabels[user?.goal || "gain"]}</p>
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="w-full mt-4">
                Edit Profile
              </Button>
            </>
          )}
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Your Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalFooEntries}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Food Entries</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalActivities}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Activities</p>
              </div>
            </div>
          </Card>

          <Button variant="danger" onClick={logout} className="w-full ring ring-red-300 hover:ring-2">
            <LogOutIcon className="size-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* View Photo Modal — only shows in normal mode */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-xs w-full mx-4 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white">Profile Photo</h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="size-48 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 mx-auto flex items-center justify-center ring-4 ring-emerald-500/20">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="size-20 text-white" />
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="font-semibold text-slate-800 dark:text-white">{user?.username}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {profilePhotoUrl ? "Looking good!" : "No photo uploaded yet"}
              </p>
            </div>

            <Button variant="secondary" className="w-full" onClick={() => setShowPhotoModal(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;