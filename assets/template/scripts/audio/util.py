"""Small audio helpers shared by the audio and QA scripts (stdlib only, no numpy).

  ff(*args)                       run ffmpeg quietly (raises on error)
  to_wav(src, dst, af)            decode anything -> 48 kHz mono 16-bit WAV, optional filter
  decode(src, af)                 -> list of 48 kHz mono float samples (32-bit: nothing clips)
  read(path) / write(path, s)     16-bit mono WAV <-> floats (write scales down if it would clip)
  peak_db(path)                   sample peak in dBFS
  normalize_peak(src, dst, db, af)  filter, then scale the peak to `db` dBFS (float intermediate)
  loudnorm_linear(src, dst, I, TP)  two-pass EBU R128, linear mode (no dynamics change)
  silences(path, noise_db, min_d)   [(start, end)] from ffmpeg silencedetect
  duration(path)                  seconds (ffprobe)
Rules baked in: work in 32-bit float, fades AFTER filters, `asetpts=PTS-STARTPTS` after atrim.
"""
import array
import math
import os
import re
import subprocess
import wave

SR = 48000


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def to_wav(src, dst, af=None):
    """Decode anything to 48 kHz mono 16-bit WAV, optionally through a filter."""
    cmd = ["-i", src, "-ac", "1", "-ar", str(SR)]
    if af:
        cmd += ["-af", af]
    ff(*cmd, "-c:a", "pcm_s16le", dst)


def decode(src, af=None):
    """Decode anything to 48 kHz mono float samples (32-bit, so nothing clips)."""
    cmd = ["ffmpeg", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(SR)]
    if af:
        cmd += ["-af", af]
    a = array.array("f")
    a.frombytes(subprocess.run([*cmd, "-f", "f32le", "-"], check=True, capture_output=True).stdout)
    return list(a)


def read(path):
    w = wave.open(path)
    assert w.getnchannels() == 1 and w.getsampwidth() == 2, path
    return [x / 32768 for x in array.array("h", w.readframes(w.getnframes()))]


def write(path, samples):
    peak = max(1e-9, max(abs(x) for x in samples))
    g = 1.0 if peak <= 0.999 else 0.999 / peak
    out = array.array("h", (int(max(-1, min(1, x * g)) * 32767) for x in samples))
    w = wave.open(path, "wb")
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
    w.close()


def peak_db(path):
    s = read(path)
    return 20 * math.log10(max(1e-9, max(abs(x) for x in s)))


def normalize_peak(src, dst, target_db=-3.0, af_extra=None):
    """Decode src (through af_extra) and scale so its peak sits at target_db dBFS.
    The intermediate is 32-bit float: a hot take or a filter's overshoot is
    measured and scaled down, never clipped at 0 dBFS first."""
    tmp = dst + ".tmp.wav"
    ff("-i", src, "-ac", "1", "-ar", str(SR), *(["-af", af_extra] if af_extra else []), "-c:a", "pcm_f32le", tmp)
    peak = max(1e-9, max(abs(x) for x in decode(tmp)))
    to_wav(tmp, dst, f"volume={target_db - 20 * math.log10(peak):.2f}dB")
    os.remove(tmp)


def loudnorm_linear(src, dst, target=-16.0, tp=-1.5):
    """Two-pass EBU R128 normalisation in linear mode (no dynamics change)."""
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", src, "-af",
         f"loudnorm=I={target}:TP={tp}:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    m = {k: re.search(rf'"{k}"\s*:\s*"([-\d.]+)"', probe).group(1)
         for k in ["input_i", "input_tp", "input_lra", "input_thresh", "target_offset"]}
    af = (f"loudnorm=I={target}:TP={tp}:LRA=11:linear=true:"
          f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    to_wav(src, dst, af)


def silences(path, noise_db=-36, min_d=0.1):
    err = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path, "-af",
         f"silencedetect=noise={noise_db}dB:d={min_d}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(starts, ends + [None] * (len(starts) - len(ends))))


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True,
    ).stdout
    return float(out.strip())
