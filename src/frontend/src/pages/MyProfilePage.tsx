import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Loader2, LogOut, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gender } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useCreateProfile } from "../hooks/useQueries";

const INTERESTS_LIST = [
  "Travel",
  "Music",
  "Cooking",
  "Reading",
  "Fitness",
  "Photography",
  "Art",
  "Movies",
  "Sports",
  "Dancing",
  "Yoga",
  "Gaming",
  "Nature",
  "Fashion",
  "Technology",
];
const HOBBIES_LIST = [
  "Painting",
  "Gardening",
  "Cycling",
  "Swimming",
  "Hiking",
  "Writing",
  "Singing",
  "Guitar",
  "Chess",
  "Baking",
  "Crafting",
  "Meditation",
  "Running",
  "Volunteering",
  "Blogging",
];

export default function MyProfilePage() {
  const { data: profile, isLoading } = useCallerProfile();
  const createProfile = useCreateProfile();
  const { clear: logout } = useInternetIdentity();
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>(Gender.male);
  const [religion, setReligion] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [occupation, setOccupation] = useState("");
  const [height, setHeight] = useState("");
  const [motherTongue, setMotherTongue] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [education, setEducation] = useState("");
  const [favoriteMovies, setFavoriteMovies] = useState<string[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<string[]>([]);
  const [thoughts, setThoughts] = useState("");
  const [mood, setMood] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [aboutMe, setAboutMe] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAge(String(Number(profile.age)));
      setGender(profile.gender);
      setReligion(profile.religion);
      setLocation(profile.location);
      setBio(profile.bio);
      setPhotoUrl(profile.photoUrl ?? "");
      setOccupation(profile.occupation);
      setHeight(profile.height);
      setMotherTongue(profile.motherTongue);
      setMaritalStatus(profile.maritalStatus);
      setInterests(profile.interests);
      setHobbies(profile.hobbies);
      setEducation(profile.education);
      setFavoriteMovies(profile.favoriteMovies);
      setFavoriteSongs(profile.favoriteSongs);
      setThoughts(profile.thoughts);
      setMood(profile.mood);
      setMediaUrls(profile.mediaUrls);
      setAboutMe(profile.aboutMe);
    }
  }, [profile]);

  const toggle = (arr: string[], set: (a: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleSave = async () => {
    try {
      await createProfile.mutateAsync({
        name,
        age: BigInt(age),
        gender,
        religion,
        location,
        bio,
        photoUrl: photoUrl || null,
        occupation,
        height,
        motherTongue,
        maritalStatus,
        interests,
        hobbies,
        education,
        favoriteMovies,
        favoriteSongs,
        thoughts,
        mood,
        mediaUrls: mediaUrls.filter(Boolean),
        aboutMe,
      });
      toast.success("Profile saved!");
      setEditing(false);
    } catch {
      toast.error("Save failed");
    }
  };

  if (isLoading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0010" }}
        data-ocid="myprofile.loading_state"
      >
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: "oklch(0.65 0.22 10/0.3)",
            borderTopColor: "oklch(0.65 0.22 10)",
          }}
        />
      </div>
    );

  const p = profile;
  const allMedia = p
    ? ([p.photoUrl, ...p.mediaUrls].filter(Boolean) as string[])
    : [];

  return (
    <div className="min-h-screen pb-8" style={{ background: "#0a0010" }}>
      {/* Hero */}
      <div className="relative h-56">
        {p?.photoUrl ? (
          <img
            src={p.photoUrl}
            alt={p.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-7xl font-bold text-white"
            style={{ background: "linear-gradient(160deg,#e11d48,#7c3aed)" }}
          >
            {p?.name?.charAt(0)}
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top,#0a0010 20%,transparent)",
          }}
        />
        <div className="absolute top-12 right-4 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            data-ocid="myprofile.edit_button"
            className="px-4 py-2 rounded-full flex items-center gap-2 text-sm text-white font-medium"
            style={{
              background: editing
                ? "linear-gradient(135deg,#e11d48,#7c3aed)"
                : "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            {editing ? (
              <>
                <Save className="w-3.5 h-3.5" />
                Editing
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </>
            )}
          </button>
          <button
            type="button"
            onClick={logout}
            data-ocid="myprofile.secondary_button"
            className="px-4 py-2 rounded-full flex items-center gap-2 text-sm text-white/70"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        {p && (
          <div className="absolute bottom-4 left-5">
            <h1 className="text-2xl font-bold text-white">
              {p.name}, {Number(p.age)}
            </h1>
            <p className="text-white/60 text-sm">📍 {p.location}</p>
          </div>
        )}
      </div>

      <div className="px-5 space-y-5 mt-4">
        {!editing ? (
          <>
            {/* View mode */}
            {p?.bio && <Section title="About">{p.bio}</Section>}
            {p?.aboutMe && <Section title="About Me">{p.aboutMe}</Section>}
            {p?.thoughts && (
              <Section title="Life Philosophy">"{p.thoughts}"</Section>
            )}
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Height", p?.height],
                ["Religion", p?.religion],
                ["Mother Tongue", p?.motherTongue],
                ["Marital", p?.maritalStatus],
                ["Education", p?.education],
                ["Mood", p?.mood],
              ]
                .filter(([, v]) => v)
                .map(([l, v]) => (
                  <div
                    key={String(l)}
                    className="rounded-xl p-2.5"
                    style={{ background: "oklch(0.14 0.05 300)" }}
                  >
                    <p className="text-white/40 text-[10px]">{l}</p>
                    <p className="text-white text-xs font-medium mt-0.5 truncate">
                      {v}
                    </p>
                  </div>
                ))}
            </div>
            {p?.interests && p.interests.length > 0 && (
              <TagSection
                title="Interests"
                tags={p.interests}
                grad="135deg,#e11d48,#7c3aed"
              />
            )}
            {p?.hobbies && p.hobbies.length > 0 && (
              <TagSection
                title="Hobbies"
                tags={p.hobbies}
                grad="135deg,#7c3aed,#2563eb"
              />
            )}
            {p?.favoriteMovies && p.favoriteMovies.length > 0 && (
              <TagSection
                title="🎬 Favorite Movies"
                tags={p.favoriteMovies}
                grad="135deg,#e11d48,#db2777"
              />
            )}
            {p?.favoriteSongs && p.favoriteSongs.length > 0 && (
              <TagSection
                title="🎵 Favorite Songs"
                tags={p.favoriteSongs}
                grad="135deg,#7c3aed,#4f46e5"
              />
            )}
            {allMedia.length > 1 && (
              <div>
                <p className="text-white/60 text-sm font-semibold mb-2">
                  Gallery
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {allMedia.slice(1).map((url, i) => (
                    <div
                      key={url || `gal-${i}`}
                      className="aspect-square rounded-xl overflow-hidden"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Edit mode */}
            <F label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Age">
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  data-ocid="myprofile.input"
                />
              </F>
              <F label="Gender">
                <Select
                  value={gender}
                  onValueChange={(v) => setGender(v as Gender)}
                >
                  <SelectTrigger data-ocid="myprofile.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Gender.male}>Male</SelectItem>
                    <SelectItem value={Gender.female}>Female</SelectItem>
                    <SelectItem value={Gender.other}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </F>
            </div>
            <F label="Photo URL">
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Religion">
              <Input
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Location">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Occupation">
              <Input
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Height">
              <Input
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Mother Tongue">
              <Input
                value={motherTongue}
                onChange={(e) => setMotherTongue(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Marital Status">
              <Input
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Education">
              <Input
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Bio">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                data-ocid="myprofile.textarea"
                className="resize-none"
              />
            </F>
            <F label="About Me">
              <Textarea
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                rows={3}
                data-ocid="myprofile.textarea"
                className="resize-none"
              />
            </F>
            <F label="Thoughts">
              <Input
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Mood">
              <Input
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                data-ocid="myprofile.input"
              />
            </F>
            <div>
              <Label className="text-white/70 text-sm mb-2 block">
                Interests
              </Label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS_LIST.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggle(interests, setInterests, i)}
                    data-ocid="myprofile.toggle"
                    className="px-3 py-1.5 rounded-full text-sm transition-all text-white"
                    style={
                      interests.includes(i)
                        ? {
                            background:
                              "linear-gradient(135deg,#e11d48,#7c3aed)",
                          }
                        : {
                            background: "oklch(0.18 0.05 300)",
                            border: "1px solid oklch(0.28 0.06 300)",
                          }
                    }
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-2 block">
                Hobbies
              </Label>
              <div className="flex flex-wrap gap-2">
                {HOBBIES_LIST.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggle(hobbies, setHobbies, h)}
                    data-ocid="myprofile.toggle"
                    className="px-3 py-1.5 rounded-full text-sm transition-all text-white"
                    style={
                      hobbies.includes(h)
                        ? {
                            background:
                              "linear-gradient(135deg,#7c3aed,#2563eb)",
                          }
                        : {
                            background: "oklch(0.18 0.05 300)",
                            border: "1px solid oklch(0.28 0.06 300)",
                          }
                    }
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <F label="Favorite Movies (comma separated)">
              <Input
                value={favoriteMovies.join(", ")}
                onChange={(e) =>
                  setFavoriteMovies(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                data-ocid="myprofile.input"
              />
            </F>
            <F label="Favorite Songs (comma separated)">
              <Input
                value={favoriteSongs.join(", ")}
                onChange={(e) =>
                  setFavoriteSongs(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                data-ocid="myprofile.input"
              />
            </F>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <F key={i} label={`Media URL ${i + 1}`}>
                <Input
                  value={mediaUrls[i] ?? ""}
                  onChange={(e) =>
                    setMediaUrls((p) => {
                      const n = [...p];
                      n[i] = e.target.value;
                      return n;
                    })
                  }
                  placeholder="https://..."
                  data-ocid="myprofile.input"
                />
              </F>
            ))}
            <Button
              onClick={handleSave}
              disabled={createProfile.isPending}
              data-ocid="myprofile.save_button"
              className="w-full h-12 rounded-2xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg,#e11d48,#7c3aed)" }}
            >
              {createProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "oklch(0.13 0.05 300)" }}
    >
      <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
        {title}
      </p>
      <p className="text-white/90 text-sm leading-relaxed">
        {children as string}
      </p>
    </div>
  );
}
function TagSection({
  title,
  tags,
  grad,
}: { title: string; tags: string[]; grad: string }) {
  return (
    <div>
      <p className="text-white/60 text-sm font-semibold mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="px-3 py-1.5 rounded-full text-white text-sm font-medium"
            style={{ background: `linear-gradient(${grad})` }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/70 text-sm">{label}</Label>
      {children}
    </div>
  );
}
