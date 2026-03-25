import os
import subprocess
import shlex

def run(cmd):
    print("Running:", cmd)
    subprocess.run(cmd, shell=True, check=True)

vid_dir = "MCP-RIPPLES"
files = sorted([f for f in os.listdir(vid_dir) if f.endswith('.mp4')])
assert len(files) == 15, f"Expected 15 videos, found {len(files)}"

vid_paths = [os.path.join(vid_dir, f) for f in files]

# 1. Linear Video
print("Building linear video...")
with open("inputs_linear.txt", "w") as f:
    for vid in vid_paths:
        f.write(f"file '{vid}'\n")

run("ffmpeg -y -f concat -safe 0 -i inputs_linear.txt -c copy output_linear.mp4")

# 2. 3-Grid (5 sets)
print("Building 3-grid sets...")
grid3_sets = []
for i in range(5):
    inputs = vid_paths[i*3 : (i+1)*3]
    out_name = f"tmp_3grid_set{i}.mp4"
    grid3_sets.append(out_name)
    # hstack 3 videos
    cmd = f"ffmpeg -y -i '{inputs[0]}' -i '{inputs[1]}' -i '{inputs[2]}' -filter_complex '[0:v][1:v][2:v]hstack=inputs=3[v]' -map '[v]' -c:v libx264 -preset veryfast -crf 23 {out_name}"
    run(cmd)

with open("inputs_3grid.txt", "w") as f:
    for vid in grid3_sets:
        f.write(f"file '{vid}'\n")

run("ffmpeg -y -f concat -safe 0 -i inputs_3grid.txt -c copy output_3grid_5sets.mp4")

# 3. 5-Grid (3 sets)
print("Building 5-grid sets...")
grid5_sets = []
for i in range(3):
    inputs = vid_paths[i*5 : (i+1)*5]
    out_name = f"tmp_5grid_set{i}.mp4"
    grid5_sets.append(out_name)
    # hstack 5 videos
    cmd = f"ffmpeg -y -i '{inputs[0]}' -i '{inputs[1]}' -i '{inputs[2]}' -i '{inputs[3]}' -i '{inputs[4]}' -filter_complex '[0:v][1:v][2:v][3:v][4:v]hstack=inputs=5[v]' -map '[v]' -c:v libx264 -preset veryfast -crf 23 {out_name}"
    run(cmd)

with open("inputs_5grid.txt", "w") as f:
    for vid in grid5_sets:
        f.write(f"file '{vid}'\n")

run("ffmpeg -y -f concat -safe 0 -i inputs_5grid.txt -c copy output_5grid_3sets.mp4")

# Clean up tmp files
for f in grid3_sets + grid5_sets + ["inputs_linear.txt", "inputs_3grid.txt", "inputs_5grid.txt"]:
    if os.path.exists(f):
        os.remove(f)

print("Done compiling videos.")
