import os
import sys

def generate_script():
    vid_dir = "MCP-RIPPLES"
    files = sorted([f for f in os.listdir(vid_dir) if f.endswith('.mp4')])
    if len(files) != 15:
        print(f"Error: expected 15 files, found {len(files)}")
        return
    
    vid_paths = [os.path.join(vid_dir, f) for f in files]
    
    with open("run_ffmpeg_v2.sh", "w") as f:
        f.write("#!/bin/bash\nset -e\n\n")
        
        # 1. Linear with audio (Concat demuxer handles audio by default)
        f.write('echo "linear"\n')
        with open("inputs_linear.txt", "w") as flin:
            for vid in vid_paths:
                flin.write(f"file '{vid}'\n")
        f.write("ffmpeg -y -f concat -safe 0 -i inputs_linear.txt -c copy output_linear_audio.mp4\n\n")
        
        # 2. 3-grid simultaneous with audio
        f.write('echo "3-grid sim"\n')
        grid3_sim = []
        for i in range(5):
            inputs = vid_paths[i*3 : (i+1)*3]
            out_name = f"tmp_3grid_sim_{i}.mp4"
            grid3_sim.append(out_name)
            cmd = f"ffmpeg -y -i '{inputs[0]}' -i '{inputs[1]}' -i '{inputs[2]}' "
            cmd += f"-filter_complex '[0:v][1:v][2:v]hstack=inputs=3[v]; [0:a][1:a][2:a]amix=inputs=3:duration=longest[a]' "
            cmd += f"-map '[v]' -map '[a]' -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k {out_name}\n"
            f.write(cmd)
            
        with open("inputs_3grid_sim.txt", "w") as f_sim:
            for v in grid3_sim:
                f_sim.write(f"file '{v}'\n")
        f.write("ffmpeg -y -f concat -safe 0 -i inputs_3grid_sim.txt -c copy output_3grid_sim.mp4\n\n")
        
        # 3. 5-grid simultaneous with audio
        f.write('echo "5-grid sim"\n')
        grid5_sim = []
        for i in range(3):
            inputs = vid_paths[i*5 : (i+1)*5]
            out_name = f"tmp_5grid_sim_{i}.mp4"
            grid5_sim.append(out_name)
            cmd = f"ffmpeg -y "
            for inp in inputs: cmd += f"-i '{inp}' "
            cmd += f"-filter_complex '[0:v][1:v][2:v][3:v][4:v]hstack=inputs=5[v]; [0:a][1:a][2:a][3:a][4:a]amix=inputs=5:duration=longest[a]' "
            cmd += f"-map '[v]' -map '[a]' -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k {out_name}\n"
            f.write(cmd)
            
        with open("inputs_5grid_sim.txt", "w") as f_sim:
            for v in grid5_sim:
                f_sim.write(f"file '{v}'\n")
        f.write("ffmpeg -y -f concat -safe 0 -i inputs_5grid_sim.txt -c copy output_5grid_sim.mp4\n\n")
        
        # 4. 3-grid SEQUENTIAL with audio
        f.write('echo "3-grid seq"\n')
        grid3_seq = []
        for i in range(5):
            inputs = vid_paths[i*3 : (i+1)*3]
            out_name = f"tmp_3grid_seq_{i}.mp4"
            grid3_seq.append(out_name)
            cmd = f"ffmpeg -y -i '{inputs[0]}' -i '{inputs[1]}' -i '{inputs[2]}' "
            
            # For 3-grid sequential, v0 plays 0-15s, v1 plays 15-30s, v2 plays 30-45s
            # We want them all to be 45s long, padded with frozen black frames.
            # Using tpad: stop_mode=clone holds the last frame. 
            # Actually, to make v1 wait 15s to start: tpad=start=450:start_mode=clone?
            # It's easier to use tpad delay frames (15s @ 30fps = 450 frames).
            # v0: stops at 15s, needs to hold for 30s (+900 frames).
            # v1: delayed by 15s (+450 frames), stops at 30s, holds for 15s (+450 frames).
            # v2: delayed by 30s (+900 frames), stops at 45s.
            
            v0_pad = "[0:v]tpad=stop=900:stop_mode=clone[v0];"
            v1_pad = "color=c=black:s=704x1280:d=15[b1]; [b1][1:v]concat=n=2:v=1:a=0[v1tmp]; [v1tmp]tpad=stop=450:stop_mode=clone[v1];"
            v2_pad = "color=c=black:s=704x1280:d=30[b2]; [b2][2:v]concat=n=2:v=1:a=0[v2];"
            
            a_mix = "[0:a]adelay=0|0[a0]; [1:a]adelay=15000|15000[a1]; [2:a]adelay=30000|30000[a2]; [a0][a1][a2]amix=inputs=3[a]"
            
            filter_str = f"{v0_pad} {v1_pad} {v2_pad} [v0][v1][v2]hstack=inputs=3[v]; {a_mix}"
            
            cmd += f"-filter_complex '{filter_str}' -map '[v]' -map '[a]' -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k {out_name}\n"
            f.write(cmd)

        with open("inputs_3grid_seq.txt", "w") as f_seq:
            for v in grid3_seq:
                f_seq.write(f"file '{v}'\n")
        f.write("ffmpeg -y -f concat -safe 0 -i inputs_3grid_seq.txt -c copy output_3grid_seq.mp4\n\n")

        # 5. 5-grid SEQUENTIAL with audio
        f.write('echo "5-grid seq"\n')
        grid5_seq = []
        for i in range(3):
            inputs = vid_paths[i*5 : (i+1)*5]
            out_name = f"tmp_5grid_seq_{i}.mp4"
            grid5_seq.append(out_name)
            cmd = f"ffmpeg -y "
            for inp in inputs: cmd += f"-i '{inp}' "
            
            # v0: 0 delay, 60s end pad (1800f)
            # v1: 15s black delay, 45s end pad (1350f)
            # v2: 30s black delay, 30s end pad (900f)
            # v3: 45s black delay, 15s end pad (450f)
            # v4: 60s black delay, 0 end pad
            
            v_pad = "[0:v]tpad=stop=1800:stop_mode=clone[v0]; "
            v_pad += "color=c=black:s=704x1280:d=15[b1]; [b1][1:v]concat=n=2:v=1:a=0[v1tmp]; [v1tmp]tpad=stop=1350:stop_mode=clone[v1]; "
            v_pad += "color=c=black:s=704x1280:d=30[b2]; [b2][2:v]concat=n=2:v=1:a=0[v2tmp]; [v2tmp]tpad=stop=900:stop_mode=clone[v2]; "
            v_pad += "color=c=black:s=704x1280:d=45[b3]; [b3][3:v]concat=n=2:v=1:a=0[v3tmp]; [v3tmp]tpad=stop=450:stop_mode=clone[v3]; "
            v_pad += "color=c=black:s=704x1280:d=60[b4]; [b4][4:v]concat=n=2:v=1:a=0[v4]; "
            
            a_mix = "[0:a]adelay=0|0[a0]; [1:a]adelay=15000|15000[a1]; [2:a]adelay=30000|30000[a2]; [3:a]adelay=45000|45000[a3]; [4:a]adelay=60000|60000[a4]; [a0][a1][a2][a3][a4]amix=inputs=5[a]"
            
            filter_str = f"{v_pad} [v0][v1][v2][v3][v4]hstack=inputs=5[v]; {a_mix}"
            
            cmd += f"-filter_complex '{filter_str}' -map '[v]' -map '[a]' -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k {out_name}\n"
            f.write(cmd)

        with open("inputs_5grid_seq.txt", "w") as f_seq:
            for v in grid5_seq:
                f_seq.write(f"file '{v}'\n")
        f.write("ffmpeg -y -f concat -safe 0 -i inputs_5grid_seq.txt -c copy output_5grid_seq.mp4\n\n")
        
        f.write('echo "CLEANUP"\n')
        f.write('rm tmp_*.mp4 inputs_*.txt\n')

generate_script()
