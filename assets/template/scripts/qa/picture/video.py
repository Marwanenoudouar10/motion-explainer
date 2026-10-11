"""Frame access for the picture QA probes (ffmpeg pipes, stdlib only).

  probe(video)                      -> (width, height, fps, frame_count)
  frames(video, vf, w, h, fmt)      yields (frame_index, bytes) after the filter chain `vf`
                                    (which must output exactly w x h pixels in `fmt`)
  LUT / lum(r, g, b)                linear-light relative luminance (WCAG) of an sRGB pixel
  contrast(l1, l2)                  WCAG contrast ratio of two luminances
"""
import json
import subprocess


def probe(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                          "stream=width,height,r_frame_rate,nb_read_packets", "-of", "json", video],
                         capture_output=True, text=True, check=True).stdout
    s = json.loads(out)["streams"][0]
    num, den = (int(x) for x in s["r_frame_rate"].split("/"))
    return int(s["width"]), int(s["height"]), num / den, int(s["nb_read_packets"])


def frames(video, vf, w, h, fmt="rgb24", start=None, end=None):
    bpp = {"rgb24": 3, "gray": 1}[fmt]
    size = w * h * bpp
    cmd = ["ffmpeg", "-v", "error"]
    if start is not None:
        cmd += ["-ss", str(start)]
    if end is not None:
        cmd += ["-to", str(end)]
    # passthrough: a `select` in vf must not be refilled with duplicated frames
    cmd += ["-i", video, "-vf", vf, "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", fmt, "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    i = 0
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield i, buf
        i += 1
    p.wait()


def _lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


LUT = [_lin(i) for i in range(256)]


def lum(r, g, b):
    return 0.2126 * LUT[r] + 0.7152 * LUT[g] + 0.0722 * LUT[b]


def contrast(l1, l2):
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)
