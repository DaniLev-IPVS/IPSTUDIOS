# Topaz 4K masters

Every hero clip was upscaled with Topaz Video (via Higgsfield) to 2160p on 2026-11-02.
Frame counts are unchanged and the hand-off frames between sections still match
(47–52 dB PSNR, against 51–53 dB before the upscale).

The 4K files are 50–160 MB each, too big for GitHub, so `v3-hd/` and `mobile-hd/` hold them
downscaled to 1080p (x264 CRF 16). `scripts/encode_hero.py` reads those first. The 4K
originals stay on Higgsfield:

| Set | Clip | 4K master |
| --- | --- | --- |
| mobile | P1-cover | job `0e093f81-5428-42b8-b1c1-16807753db81` |
| mobile | P2-world | job `5c80625d-db14-437b-a50d-ef02700aded8` |
| mobile | P3-proof | job `995efe09-5647-4a92-94d9-9d475a05f88e` |
| mobile | P4-problem | job `9f3d6dc4-f424-4fc6-99bc-052ca300c747` |
| mobile | P5-vision | job `106a3c13-abdb-4e2e-8e2b-4984a391c850` |
| mobile | P6-team | job `ac6ba1a1-732c-4aa5-9d98-f747f6ab6ca1` |
| mobile | P7-contact | job `2690632c-6e97-4aa0-bf5b-f7a5d999bf5c` |
| v3 | P1-cover | job `74f342e1-d351-4c27-b864-472a7ebc2e66` |
| v3 | P2-world | job `4e76525e-e1ea-41d4-9b86-5e05ca4bc5b5` |
| v3 | P3-proof | job `782491e1-9de7-497d-85cc-a70f9e461947` |
| v3 | P4-problem | job `d890e041-300a-4d28-975e-bed93072068e` |
| v3 | P5-vision | job `2c663ea2-3e81-4706-9954-d6deba19efb4` |
| v3 | P6-team | job `18a1cd6b-05c9-4008-a71f-a198b5570ed2` |
| v3 | P7-contact | job `79e05769-5376-4530-b05b-3e6bf950c21a` |
