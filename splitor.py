# -*- coding: utf-8 -*-
"""
Created on Tue Dec 24 14:55:15 2024

@author: Divas
"""

def split_wiki_trace():
    # Dictionary to store content between markers
    file_contents = {
        # 'manifest.json': '',
        'content.js': '',
        'background.js': '',
        'popup.html': '',
        'popup.js': '',
        'styles.css': ''
    }
    
    current_file = None
    
    # Read the input file
    try:
        with open('wikiTrace.txt', 'r', encoding='utf-8') as input_file:
            for line in input_file:
                # Check for markers with space after //
                stripped_line = line.strip()
                if stripped_line.startswith('// '):
                    # Remove '// ' and whitespace
                    filename = stripped_line[3:].strip()
                    if filename in file_contents:
                        current_file = filename
                        continue
                
                # Append content to current file if we're tracking one
                if current_file:
                    file_contents[current_file] += line
    
        # Write content to separate files
        for filename, content in file_contents.items():
            with open(filename, 'w', encoding='utf-8') as output_file:
                # Remove trailing whitespace but keep content formatting
                output_file.write(content.rstrip())
            print(f"Created: {filename}")
            
    except FileNotFoundError:
        print("Error: wikiTrace.txt not found")
    except Exception as e:
        print(f"An error occurred: {str(e)}")


if __name__ == "__main__":
    split_wiki_trace()