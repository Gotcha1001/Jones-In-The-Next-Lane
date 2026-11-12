"use client";

/**
 * VideoLobby — live video/audio for a game room, built directly on
 * livekit-client (no @livekit/components-react).
 *
 * Identity comes from the server (Clerk session) — the component only sends
 * the Convex room id and a display name to /api/livekit-token.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  type TrackPublication,
} from "livekit-client";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from "lucide-react";

interface VideoLobbyProps {
  roomId: string;
  userName: string;
  defaultCollapsed?: boolean;
}

interface ParticipantState {
  participant: Participant;
  videoTrack: Track | null;
  audioTrack: Track | null;
  isLocal: boolean;
}

interface TokenResponse {
  token?: string;
  error?: string;
}

async function fetchToken(roomId: string, userName: string): Promise<string> {
  const res = await fetch(
    `/api/livekit-token?room=${encodeURIComponent(roomId)}&userName=${encodeURIComponent(userName)}`,
  );
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || !data.token)
    throw new Error(data.error ?? `Token request failed (${res.status})`);
  return data.token;
}

function TrackMedia({
  track,
  kind,
  muted,
}: {
  track: Track;
  kind: "video" | "audio";
  muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = kind === "video" ? videoRef.current : audioRef.current;
    if (!el) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track, kind]);

  return kind === "video" ? (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ transform: muted ? "scaleX(-1)" : undefined }}
    />
  ) : (
    <audio ref={audioRef} autoPlay />
  );
}

function ParticipantTile({ state }: { state: ParticipantState }) {
  const { participant, videoTrack, audioTrack, isLocal } = state;
  const name = participant.name ?? participant.identity;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative h-[90px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-cyan-400/20 bg-black/60 shadow-[0_0_16px_color-mix(in_oklab,var(--accent-400)_20%,transparent)]"
    >
      {videoTrack ? (
        <TrackMedia track={videoTrack} kind="video" muted={isLocal} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-900/40 to-black/80">
          <div className="flex h-9 w-9 select-none items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white shadow-[0_0_10px_color-mix(in_oklab,var(--accent-400)_50%,transparent)]">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      {audioTrack && !isLocal && (
        <TrackMedia track={audioTrack} kind="audio" muted={false} />
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1">
        <span className="truncate text-[9px] font-semibold text-white">
          {isLocal ? "You" : name}
        </span>
        <span className="flex items-center gap-0.5">
          {!audioTrack && <MicOff size={8} className="text-red-400" />}
          {!videoTrack && <VideoOff size={8} className="text-red-400" />}
        </span>
      </div>
    </motion.div>
  );
}

function buildSnapshot(room: Room): ParticipantState[] {
  const toState = (p: Participant, isLocal: boolean): ParticipantState => {
    let videoTrack: Track | null = null;
    let audioTrack: Track | null = null;
    p.trackPublications.forEach((pub: TrackPublication) => {
      if (!pub.track) return;
      if (pub.kind === Track.Kind.Video) videoTrack = pub.track;
      if (pub.kind === Track.Kind.Audio) audioTrack = pub.track;
    });
    return { participant: p, videoTrack, audioTrack, isLocal };
  };
  return [
    toState(room.localParticipant, true),
    ...Array.from(room.remoteParticipants.values()).map(
      (p: RemoteParticipant) => toState(p, false),
    ),
  ];
}

const REFRESH_EVENTS = [
  RoomEvent.ParticipantConnected,
  RoomEvent.ParticipantDisconnected,
  RoomEvent.TrackSubscribed,
  RoomEvent.TrackUnsubscribed,
  RoomEvent.TrackPublished,
  RoomEvent.TrackUnpublished,
  RoomEvent.LocalTrackPublished,
  RoomEvent.LocalTrackUnpublished,
  RoomEvent.TrackMuted,
  RoomEvent.TrackUnmuted,
] as const;

function useParticipantStates(room: Room | null): ParticipantState[] {
  const [states, setStates] = useState<ParticipantState[]>([]);
  useEffect(() => {
    if (!room) {
      queueMicrotask(() => setStates([]));
      return;
    }
    const initial = buildSnapshot(room);
    queueMicrotask(() => setStates(initial));
    const refresh = (): void => setStates(buildSnapshot(room));
    REFRESH_EVENTS.forEach((ev) => room.on(ev, refresh));
    return () => {
      REFRESH_EVENTS.forEach((ev) => room.off(ev, refresh));
    };
  }, [room]);
  return states;
}

export function VideoLobby({
  roomId,
  userName,
  defaultCollapsed = false,
}: VideoLobbyProps) {
  const roomRef = useRef<Room | null>(null);
  const [connState, setConnState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const participants = useParticipantStates(room);

  useEffect(() => {
    let cancelled = false;
    const lk = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: { resolution: VideoPresets.h180.resolution },
    });
    roomRef.current = lk;
    lk.on(RoomEvent.ConnectionStateChanged, (s: ConnectionState) =>
      setConnState(s),
    );

    fetchToken(roomId, userName)
      .then(async (token) => {
        const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!url) throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not set");
        await lk.connect(url, token);
        if (cancelled) {
          await lk.disconnect();
          return;
        }
        setRoom(lk);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Video connection failed",
          );
      });

    return () => {
      cancelled = true;
      void lk.disconnect();
      roomRef.current = null;
      setRoom(null);
    };
  }, [roomId, userName]);

  const toggleCamera = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    const next = !cameraOn;
    try {
      await r.localParticipant.setCameraEnabled(next);
      setCameraOn(next);
    } catch {
      setError("Couldn't access the camera.");
    }
  }, [cameraOn]);

  const toggleMic = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    const next = !micOn;
    try {
      await r.localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
    } catch {
      setError("Couldn't access the microphone.");
    }
  }, [micOn]);

  const connected = connState === ConnectionState.Connected;
  const connecting =
    connState === ConnectionState.Connecting ||
    connState === ConnectionState.Reconnecting;

  // Semantic on/off colours stay — mic/camera state should remain clear
  const toggleClass = (on: boolean): string =>
    `flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
      on
        ? "border-emerald-600/40 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60"
        : "border-red-600/40 bg-red-900/40 text-red-300 hover:bg-red-900/60"
    }`;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm accent-card">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 transition-all hover:bg-cyan-400/5"
      >
        <span className="flex items-center gap-2">
          <Video size={14} className="text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Video chat
          </span>
          {connected && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          )}
          {connecting && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          )}
          {error && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
        </span>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-4 pb-4">
              {error && (
                <p className="flex items-center gap-1.5 py-1 text-xs text-red-400">
                  <WifiOff size={11} /> {error}
                </p>
              )}
              {!error && connecting && (
                <p className="animate-pulse py-1 text-xs text-amber-500">
                  Connecting to video…
                </p>
              )}
              {!error && connected && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {participants.map((s) => (
                        <ParticipantTile
                          key={s.participant.identity}
                          state={s}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleMic()}
                      className={toggleClass(micOn)}
                    >
                      {micOn ? <Mic size={12} /> : <MicOff size={12} />}
                      {micOn ? "Mic on" : "Muted"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleCamera()}
                      className={toggleClass(cameraOn)}
                    >
                      {cameraOn ? <Video size={12} /> : <VideoOff size={12} />}
                      {cameraOn ? "Camera on" : "Camera off"}
                    </button>
                    <span className="ml-auto flex items-center gap-1 text-[9px] text-emerald-500/70">
                      <Wifi size={9} /> Live
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
