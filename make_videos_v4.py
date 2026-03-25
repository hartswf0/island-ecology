import os
import subprocess

def run(cmd):
    print("Running:", cmd)
    subprocess.run(cmd, shell=True, check=True)

vid1 = "MCP-RIPPLES/Generative_Video_Abandoned_House_Decay.mp4"
vid2 = "MCP-RIPPLES/RIPPLES_Nonhuman_Sentience_Interface_Design.mp4"
base_vid = "output_3grid_seq_frozen.mp4"
out_vid = "output_3grid_seq_frozen_extended.mp4"

# We scale the 1280x720 video to fit 2112x1280.
# Width 2112 scale gives height 2112 * (720/1280) = 1188.
# Then pad to 2112x1280.
scale_pad = "scale=2112:-2,pad=2112:1280:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=30"

cmd = f"""ffmpeg -y -i '{base_vid}' -i '{vid1}' -i '{vid2}' \\
-filter_complex "[1:v]{scale_pad},format=yuv420p[v1]; [2:v]{scale_pad},format=yuv420p[v2]; [0:v][0:a][v1][1:a][v2][2:a]concat=n=3:v=1:a=1[v][a]" \\
-map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k -ar 96000 {out_vid}"""

run(cmd)
