import os
import sys

def generate_script():
    vid_dir = "MCP-RIPPLES"
    files = sorted([f for f in os.listdir(vid_dir) if f.endswith('.mp4')])
    if len(files) != 15:
        print(f"Error: expected 15 files, found {len(files)}")
        return
    
    vid_paths = [os.path.join(vid_dir, f) for f in files]
    
    with open("run_ffmpeg_v3.sh", "w") as f:
        f.write("#!/bin/bash\nset -e\n\n")
        
        # 4. 3-grid SEQUENTIAL with audio and frozen start frames
        f.write('echo "3-grid seq (frozen starts)"\n')
        grid3_seq = []
        for i in range(5):
            inputs = vid_paths[i*3 : (i+1)*3]
            out_name = f"tmp_3grid_seq_{i}.mp4"
            grid3_seq.append(out_name)
            cmd = f"ffmpeg -y -i '{inputs[0]}' -i '{inputs[1]}' -i '{inputs[2]}' "
            
            # v0: freeze for rest of 30s (900f)
            v0_pad = "[0:v]tpad=stop=900:stop_mode=clone[v0];"
            # v1: freeze start for 15s (450f), freeze end for 15s (450f) 
            v1_pad = "[1:v]tpad=start=450:start_mode=clone:stop=450:stop_mode=clone[v1];"
            # v2: freeze start for 30s (900f)
            v2_pad = "[2:v]tpad=start=900:start_mode=clone[v2];"
            
            a_mix = "[0:a]adelay=0|0[a0]; [1:a]adelay=15000|15000[a1]; [2:a]adelay=30000|30000[a2]; [a0][a1][a2]amix=inputs=3[a]"
            
            filter_str = f"{v0_pad} {v1_pad} {v2_pad} [v0][v1][v2]hstack=inputs=3[v]; {a_mix}"
            
            cmd += f"-filter_complex '{filter_str}' -map '[v]' -map '[a]' -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k {out_name}\n"
            f.write(cmd)

        with open("inputs_3grid_seq.txt", "w") as f_seq:
            for v in grid3_seq:
                f_seq.write(f"file '{v}'\n")
        f.write("ffmpeg -y -f concat -safe 0 -i inputs_3grid_seq.txt -c copy output_3grid_seq_frozen.mp4\n\n")

        # 5. 5-grid SEQUENTIAL with audio and frozen start frames
        f.write('echo "5-grid seq (frozen starts)"\n')
        grid5_seq = []
        for i in range(3):
            inputs = vid_paths[i*5 : (i+1)*5]
            out_name = f"tmp_5grid_seq_{i}.mp4"
            grid5_seq.append(out_name)
            cmd = f"ffmpeg -y "
            for inp in inputs: cmd += f"-i '{inp}' "
            
            v_pad = "[0:v]tpad=stop=1800:stop_mode=clone[v0]; "
            v_pad += "[1:v]tpad=start=450:start_mode=clone:stop=1350:stop_mode=clone[v1]; "
            v_pad += "[2:v]tpad=start=900:start_mode=clone:stop=900:stop_mode=clone[v2]; "
            v_pad += "[3:v]tpad=start=1350:start_mode=clone:stop=450:stop_mode=clone[v3]; "
            v_pad += "[4:v]tpad=start=1800:start_mode=clone[v4]; "
            
            a_mix = "[0:a]adelay=0|0[a0]; [1:a]adelay=15000|15000[a1]; [2:a]adelay=30000|30000[a2]; [3:a]adelay=45000|45000[a3]; [4:a]adelay=60000|60000[a4]; [a0][a1][a2][a3][a4]amix=inputs=5[a]"
            
            filter_str = f"{v_pad} [v0][v1][v2][v3][v4]hstack=inputs=5[v]; {a_mix}"
            
            cmd += f"-filter_complex '{filter_str}' -map '[v]' -map '[a]' -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k {out_name}\n"
            f.write(cmd)

        with open("inputs_5grid_seq.txt", "w") as f_seq:
            for v in grid5_seq:
                f_seq.write(f"file '{v}'\n")
        f.write("ffmpeg -y -f concat -safe 0 -i inputs_5grid_seq.txt -c copy output_5grid_seq_frozen.mp4\n\n")
        
        f.write('echo "CLEANUP"\n')
        f.write('rm tmp_*.mp4 inputs_*.txt\n')

generate_script()
