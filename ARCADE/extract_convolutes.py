#!/usr/bin/env python3
"""
Extract Benjamin's Arcades Project convolutes from pdftotext output.
Cleans OCR artifacts, extracts fragments by marker, and produces data.js
with actual Benjamin text embedded in POML WorldText worlds.
"""

import re
import json
import textwrap

RAW_FILE = "arcades_raw.txt"
OUTPUT_FILE = "data.js"

# Convolute metadata
CONVOLUTE_META = {
    "A": {"title": "Arcades, Magasins de Nouveautés, Sales Clerks", "genre": "urban archaeology / commercial phantasmagoria"},
    "B": {"title": "Fashion", "genre": "material culture / temporal dialectics"},
    "C": {"title": "Ancient Paris, Catacombs, Demolitions", "genre": "urban palimpsest / archaeological memory"},
    "D": {"title": "Boredom, Eternal Return", "genre": "temporal philosophy / cosmology of modernity"},
    "E": {"title": "Haussmannization, Barricade Fighting", "genre": "urban politics / revolutionary topology"},
    "F": {"title": "Iron Construction", "genre": "architectural materialism / technological unconscious"},
    "G": {"title": "Exhibitions, Advertising, Grandville", "genre": "spectacle / commodity aesthetics"},
    "H": {"title": "The Collector", "genre": "material culture / psychology of possession"},
    "I": {"title": "The Interior, The Trace", "genre": "domestic space / forensics of inhabitation"},
    "J": {"title": "Baudelaire", "genre": "literary modernism / urban allegory"},
    "K": {"title": "Dream City and Dream House, Dreams of the Future", "genre": "utopian imagination / collective dreaming"},
    "L": {"title": "Dream House, Museum, Spa", "genre": "architectural unconscious / bourgeois interiority"},
    "M": {"title": "The Flâneur", "genre": "urban epistemology / ambulatory knowledge"},
    "N": {"title": "On the Theory of Knowledge, Theory of Progress", "genre": "epistemology / dialectical method"},
    "O": {"title": "Prostitution, Gambling", "genre": "commodity body / chance and fate"},
    "P": {"title": "The Streets of Paris", "genre": "urban topography / street phenomenology"},
    "Q": {"title": "Panorama", "genre": "visual technology / totalization of vision"},
    "R": {"title": "Mirrors", "genre": "optical technology / doubling and illusion"},
    "S": {"title": "Painting, Jugendstil, Novelty", "genre": "art history / the new as commodity"},
    "T": {"title": "Modes of Lighting", "genre": "illumination technology / nocturnal city"},
    "U": {"title": "Saint-Simon, Railroads", "genre": "techno-utopianism / infrastructure as ideology"},
    "V": {"title": "Conspiracies, Compagnonnage", "genre": "secret societies / workers' organization"},
    "W": {"title": "Fourier", "genre": "utopian socialism / phalanstery as world model"},
    "X": {"title": "Marx", "genre": "political economy / commodity fetishism"},
    "Y": {"title": "Photography", "genre": "mechanical reproduction / image technology"},
    "Z": {"title": "The Doll, The Automaton", "genre": "mimesis / artificial life"},
    "a": {"title": "Social Movement", "genre": "labor history / class struggle"},
    "b": {"title": "Daumier", "genre": "caricature / political graphics"},
    "d": {"title": "Literary History, Hugo", "genre": "literary institution / popular novel"},
    "g": {"title": "The Stock Exchange, Economic History", "genre": "financial infrastructure / speculation"},
    "i": {"title": "Reproduction Technology, Lithography", "genre": "print technology / mass image"},
    "k": {"title": "The Commune", "genre": "revolutionary event / urban insurrection"},
    "l": {"title": "The Seine, The Oldest Paris", "genre": "river topography / geological memory"},
    "m": {"title": "Idleness", "genre": "non-productive time / resistance to labor"},
    "p": {"title": "Anthropological Materialism, History of Sects", "genre": "body politics / heretical knowledge"},
    "r": {"title": "École Polytechnique", "genre": "technical education / state engineering"},
}


def clean_ocr_text(raw: str) -> str:
    """
    Clean pdftotext -layout output.
    
    The layout mode preserves spatial positioning, so two-column text appears as:
    - Left column text followed by large whitespace followed by right column text
    - The right column is usually a duplicate/continuation
    
    Strategy:
    1. For lines with large internal gaps (>10 spaces), take only the left portion
    2. Rejoin hyphenated words
    3. Collapse into readable paragraphs
    4. Remove remaining word-level duplicates
    """
    raw = raw.replace('\f', '')
    lines = raw.split('\n')
    cleaned = []
    
    for line in lines:
        if not line.strip():
            if cleaned and cleaned[-1] != '':
                cleaned.append('')
            continue
        
        # Detect two-column lines: if there's a gap of 10+ spaces in the middle
        # take the left portion only (the right is usually a duplicate from the
        # previous line's wrap-around)
        gap_match = re.search(r'(\S)\s{10,}(\S)', line)
        if gap_match:
            left_part = line[:gap_match.start() + 1].strip()
            right_part = line[gap_match.end() - 1:].strip()
            
            # Check if right part duplicates the end of left part or start of next content
            # If left part ends with the same words that right part starts with, skip right
            if left_part and right_part:
                left_words = left_part.split()
                right_words = right_part.split()
                
                # Common pattern: left ends with "word" and right starts with "word"
                if left_words and right_words:
                    if left_words[-1].rstrip('.,;:!?\'"') == right_words[0].rstrip('.,;:!?\'"'):
                        # Duplicate start — take left only
                        stripped = left_part
                    elif len(right_words) == 1 and right_part.startswith('['):
                        # Fragment marker on the right — keep it
                        stripped = left_part + ' ' + right_part
                    else:
                        # Take left part; right is likely a column duplicate
                        stripped = left_part
                else:
                    stripped = left_part
            else:
                stripped = left_part if left_part else right_part
        else:
            stripped = line.strip()
        
        if stripped:
            cleaned.append(stripped)
    
    # Second pass: merge consecutive lines that form a single sentence
    # and remove lines that are pure duplicates of the previous line
    merged = []
    for line in cleaned:
        if not line:
            if merged and merged[-1] != '':
                merged.append('')
            continue
        
        # Skip if this line is a subset of the previous line
        if merged and merged[-1] and line in merged[-1]:
            continue
        # If previous is a subset of this line, replace
        if merged and merged[-1] and merged[-1] in line:
            merged[-1] = line
            continue
        
        merged.append(line)
    
    # Third pass: rejoin hyphenated words
    text = '\n'.join(merged)
    text = re.sub(r'(\w)­\s*\n\s*(\w)', r'\1\2', text)   # Unicode soft hyphen
    text = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', text)    # Regular hyphen at end of line
    
    # Fourth pass: collapse into paragraphs
    paragraphs = []
    current = []
    for line in text.split('\n'):
        stripped = line.strip()
        if not stripped:
            if current:
                paragraphs.append(' '.join(current))
                current = []
        else:
            current.append(stripped)
    if current:
        paragraphs.append(' '.join(current))
    
    result = '\n\n'.join(paragraphs)
    
    # Final: collapse multiple spaces, remove stray OCR artifacts
    result = re.sub(r'  +', ' ', result)
    result = re.sub(r'\s*\.\s*\.\s*\.\s*', '... ', result)  # Normalize ellipsis
    
    return result.strip()


def extract_fragments(text: str) -> dict:
    """Extract fragments grouped by convolute letter."""
    # Pattern: [A1,2] or [A2a,3] or [a1,2] etc.
    pattern = r'\[([A-Za-z]\d*[a-z]?)\s*,\s*(\d+)\]'
    
    # Find all marker positions
    markers = []
    for m in re.finditer(pattern, text):
        letter = re.sub(r'\d.*', '', m.group(1))  # Extract just the letter
        full_ref = f"[{m.group(1)},{m.group(2)}]"
        markers.append({
            'letter': letter,
            'ref': full_ref,
            'pos': m.end()
        })
    
    # Extract text between markers
    convolutes = {}
    for i, marker in enumerate(markers):
        end_pos = markers[i + 1]['pos'] - len(markers[i + 1]['ref']) - 20 if i + 1 < len(markers) else marker['pos'] + 2000
        fragment_text = text[marker['pos']:end_pos].strip()
        
        # Clean the fragment
        fragment_text = clean_ocr_text(fragment_text)
        
        # Skip very short fragments (OCR noise)
        if len(fragment_text) < 50:
            continue
        
        letter = marker['letter']
        if letter not in convolutes:
            convolutes[letter] = []
        
        convolutes[letter].append({
            'ref': marker['ref'],
            'text': fragment_text[:800]  # Cap at 800 chars per fragment
        })
    
    return convolutes


def select_best_fragments(fragments: list, n: int = 5) -> list:
    """Select the most substantive fragments."""
    # Sort by length (proxy for substance) and take top n
    sorted_frags = sorted(fragments, key=lambda f: len(f['text']), reverse=True)
    return sorted_frags[:n]


def build_world(uid: str, conv_letter: str, frag_group: list, world_num: int) -> dict:
    """Build a POML world from a group of related fragments."""
    meta = CONVOLUTE_META.get(conv_letter, {"title": f"Convolute {conv_letter}", "genre": "critical theory"})
    
    # Combine fragment texts as the source material
    source_texts = []
    refs = []
    for frag in frag_group:
        source_texts.append(frag['text'])
        refs.append(frag['ref'])
    
    combined_text = '\n\n---\n\n'.join(source_texts)
    refs_str = ', '.join(refs)
    
    # Extract a description from the first meaningful sentence
    first_text = source_texts[0]
    # Get first 200 chars as description, ending at a sentence boundary
    desc_text = first_text[:250]
    # Try to end at a period
    last_period = desc_text.rfind('.')
    if last_period > 50:
        desc_text = desc_text[:last_period + 1]
    else:
        desc_text = desc_text[:200] + '...'
    # Clean for JSON
    desc_text = desc_text.replace('"', "'").replace('\n', ' ').strip()
    
    name = f"{conv_letter}_{world_num:02d}_{meta['title'].split(',')[0].strip().replace(' ', '')}"
    name = re.sub(r'[^a-zA-Z0-9_]', '', name)
    
    # Escape the combined text for embedding in the raw string
    escaped_text = combined_text.replace('\\', '\\\\').replace('"', '\\"')
    # Convert newlines to literal \n for JSON, but keep them as structural breaks
    escaped_for_raw = escaped_text.replace('\n', '\\n')
    
    # Build WorldText with actual source material as readable embedded text
    raw = (
        '{\n\n'
        'meta {\n'
        f'  genre: "{meta["genre"]}"\n'
        f'  convolute: "{conv_letter}: {meta["title"]}"\n'
        f'  fragments: "{refs_str}"\n'
        f'  description: "{desc_text}"\n'
        '}\n\n'
        'source_text {\n'
        f'  """{escaped_for_raw}"""\n'
        '}\n\n'
        'locations {\n'
        f'  location <Convolute_{conv_letter}> {{\n'
        f'    description: "{meta["title"]}"\n'
        '    type: "thematic_constellation"\n'
        '  }\n'
        '}\n\n'
        'entities {\n'
        f'  entity <Constellation_{conv_letter}_{world_num}> : textual_constellation {{\n'
        f'    traits: [Benjaminian, convolute_{conv_letter}, {refs_str.replace("[","").replace("]","").replace(",","_").replace(" ","")}]\n'
        f'    location: <Convolute_{conv_letter}>\n'
        '  }\n'
        '}\n\n'
        'relations {\n'
        f'  rel [belongs_to](<Constellation_{conv_letter}_{world_num}> -> <Convolute_{conv_letter}>)\n'
        '}\n\n'
        'states {\n'
        f'  state <Convolute_{conv_letter}.status> = "raw_material_for_dialectical_image"\n'
        '}\n\n'
        'timeline {\n'
        '  time <NineteenthCentury> {\n'
        '    description: "The century of the arcades, the phantasmagoria, and the dream collective"\n'
        '  }\n'
        '}\n\n'
        '}'
    )
    
    return {
        "uid": uid,
        "name": name,
        "source": f"convolute-{conv_letter}.md",
        "raw": raw,
        "meta": {
            "genre": meta['genre'],
            "description": desc_text
        }
    }


def main():
    print("Reading raw text...")
    with open(RAW_FILE, 'r', encoding='utf-8', errors='replace') as f:
        raw_text = f.read()
    
    print("Extracting fragments...")
    convolutes = extract_fragments(raw_text)
    
    print(f"Found {len(convolutes)} convolutes:")
    for letter in sorted(convolutes.keys()):
        print(f"  {letter}: {len(convolutes[letter])} fragments")
    
    # Build worlds
    worlds = []
    uid_counter = 1
    
    # Process each convolute
    for conv_letter in sorted(convolutes.keys()):
        if conv_letter not in CONVOLUTE_META:
            continue
        
        frags = convolutes[conv_letter]
        if len(frags) < 2:
            continue
        
        # Select best fragments and group them
        best = select_best_fragments(frags, n=min(15, len(frags)))
        
        # Create 2-3 worlds per convolute, each with 3-5 fragments
        group_size = max(3, len(best) // 3)
        for i in range(0, len(best), group_size):
            group = best[i:i + group_size]
            if len(group) < 2:
                continue
            
            uid = f"{conv_letter}-{uid_counter:04d}"
            world = build_world(uid, conv_letter, group, i // group_size + 1)
            worlds.append(world)
            uid_counter += 1
    
    print(f"\nGenerated {len(worlds)} worlds")
    
    # Write data.js
    print(f"Writing {OUTPUT_FILE}...")
    js_content = "const WORLDS_DATA = " + json.dumps(worlds, indent=2, ensure_ascii=False) + ";\n"
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print("Done!")


if __name__ == '__main__':
    main()
