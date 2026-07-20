import { File } from "expo-file-system";

import { supabase } from "./supabase";

export interface Spot {
  id: string;
  created_at: string;
  user_id: string | null;
  lat: number;
  lng: number;
  photo_path: string;
  taken_at: string | null;
}

export interface NewSpot {
  lat: number;
  lng: number;
  takenAt: Date | null;
  photo: {
    uri: string;
    mimeType: string;
  };
}

export async function fetchSpots(): Promise<Spot[]> {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`スポットの取得に失敗しました: ${error.message}`);
  }
  return data;
}

export async function fetchSpot(id: string): Promise<Spot> {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`スポットの取得に失敗しました: ${error.message}`);
  }
  return data;
}

/** Signs in anonymously if there is no active session, and returns the user id. */
async function ensureSignedIn(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    return sessionData.session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(`サインインに失敗しました: ${error?.message ?? "unknown"}`);
  }
  return data.user.id;
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    default:
      return "jpg";
  }
}

export async function createSpot(input: NewSpot): Promise<Spot> {
  const userId = await ensureSignedIn();

  const bytes = await new File(input.photo.uri).bytes();
  const extension = extensionForMimeType(input.photo.mimeType);
  const photoPath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(photoPath, bytes, { contentType: input.photo.mimeType });

  if (uploadError) {
    throw new Error(`写真のアップロードに失敗しました: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from("spots")
    .insert({
      user_id: userId,
      lat: input.lat,
      lng: input.lng,
      photo_path: photoPath,
      taken_at: input.takenAt ? input.takenAt.toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`スポットの投稿に失敗しました: ${error.message}`);
  }
  return data;
}
