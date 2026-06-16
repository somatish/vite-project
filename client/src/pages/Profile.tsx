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
import Cropper from "react-easy-crop";

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
  
  // Photo Processing States
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // react-easy-crop state engine
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const profilePhotoUrl = user?.profilePhoto?.url
    ? user.profilePhoto.url.startsWith("http")
      ? user.profilePhoto.url
      : `${import.meta.env.VITE_STRAPI_API_URL}${user.profilePhoto.url}`
    : null;

  // 1. Image selection setup (Triggers Crop Modal)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 2. Extract cropped area locally (Saves to temporary preview state)
  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      setPendingFile(croppedFile);
      setPhotoPreview(URL.createObjectURL(croppedFile)); 
      setImageSrc(null); 
    } catch (e) {
      console.error(e);
      toast.error("Failed to crop image");
    }
  };

  // 3. IMMEDIATE DELETION (Executed directly from normal view layout)
  const handleDeleteImmediate = async () => {
    setIsUploadingPhoto(true);
    try {
      await api.put(`/api/users/${user?.id}`, { profilePhoto: null });
      await fetchUser(user?.token || "");
      setPhotoPreview(null);
      setPendingFile(null);
      toast.success("Profile photo deleted successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete photo");
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

  // 4. Update Handler (Uploads cropped file ONLY when saving structural form data)
  const handleSave = async () => {
    setIsUploadingPhoto(true);
    try {
      let currentPhotoId = user?.profilePhoto?.id || null;

      if (pendingFile) {
        const uploadForm = new FormData();
        uploadForm.append("files", pendingFile);
        const { data: uploaded } = await api.post("/api/upload", uploadForm, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        currentPhotoId = uploaded[0]?.id;
      }

      await api.put(`/api/users/${user?.id}`, {
        ...formData,
        profilePhoto: currentPhotoId,
      });

      await fetchUser(user?.token || "");
      toast.success("Profile updated successfully");

      setPendingFile(null);
      setPhotoPreview(null);
      setIsEditing(false);
    } catch (error: any) {
      console.log(error);
      toast.error(error?.message || "Failed to update profile");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPhotoPreview(null);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchUserData();
  };

  const stats = {
    totalFooEntries: allFoodLogs.length || 0,
    totalActivities: allActivityLogs.length || 0,
  };

  if (!user || !formData) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your profile</p>
      </div>

      <div className="profile-content">
        <Card>
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar Panel */}
            <div
              className="relative group cursor-pointer flex-shrink-0"
              onClick={() => (isEditing ? fileInputRef.current?.click() : setShowPhotoModal(true))}
            >
              <div className="size-16 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-2 ring-emerald-500/30">
                {photoPreview || profilePhotoUrl ? (
                  <img
                    src={photoPreview || profilePhotoUrl!}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
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

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Profile Meta Info */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{user?.username}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Member Since {new Date(user?.createdAt || "").toLocaleDateString()}
              </p>
              
              {/* Contextual Action Space */}
              <div className="mt-1">
                {isEditing ? (
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Tap photo to change</p>
                ) : (
                  profilePhotoUrl ? (
                    <button
                      type="button"
                      onClick={handleDeleteImmediate}
                      className="text-red-500 hover:text-red-600 text-xs font-semibold underline transition-colors block text-left"
                    >
                      Delete Photo
                    </button>
                    ) : (
                    <p className="text-slate-400 dark:text-slate-500 text-xs">No photo uploaded</p>
                  )
                )}
              </div>
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
                <Button variant="secondary" className="flex-1" onClick={handleCancel}>
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
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Calendar className="size-4.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Age</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{user.age} years</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Scale className="size-4.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Weight</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{user.weight} kg</p>
                  </div>
                </div>

                {user.height !== 0 && (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <User className="size-4.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Height</p>
                      <p className="font-semibold text-slate-800 dark:text-white">{user.height} cm</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <Target className="size-4.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Goal</p>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {goalLabels[user?.goal || "gain"]}
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="w-full mt-4">
                Edit Profile
              </Button>
            </>
          )}
        </Card>

        {/* Right Stats Column */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Your Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.totalFooEntries}
                </p>
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

      {/* Interactive Cropper Overlay Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/90 backdrop-blur-sm p-4 justify-between items-center">
          <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
            <h3 className="font-semibold text-lg">Crop Profile Picture</h3>
            <button onClick={() => setImageSrc(null)} className="p-1 hover:bg-slate-800 rounded-full">
              <X className="size-5" />
            </button>
          </div>

          <div className="relative w-full max-w-md aspect-square bg-slate-950 rounded-xl overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>

          <div className="w-full max-w-md mt-4 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <span className="text-xs">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 text-white border-slate-700" onClick={() => setImageSrc(null)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleCropComplete}>
                Apply Crop
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Photo Modal */}
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
              {photoPreview || profilePhotoUrl ? (
                <img src={photoPreview || profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
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

// Canvas processor utility
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      resolve(new File([blob], "profile-avatar.jpg", { type: "image/jpeg" }));
    }, "image/jpeg");
  });
}

export default Profile;