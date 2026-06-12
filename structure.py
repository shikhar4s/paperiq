import os

def print_directory_structure(root_dir, exclude=None, indent=0):
    """
    Prints directory structure (folders + files) recursively, excluding given folders.
    
    :param root_dir: Root directory to start from
    :param exclude: List of folder names to exclude
    :param indent: Current indentation level (for internal use)
    """
    exclude = exclude or []
    
    try:
        items = sorted(os.listdir(root_dir))
    except PermissionError:
        print(" " * indent + f"[Access Denied]: {root_dir}")
        return

    for item in items:
        path = os.path.join(root_dir, item)
        if os.path.isdir(path):
            if item not in exclude:
                print(" " * indent + f"📁 {item}/")
                print_directory_structure(path, exclude, indent + 4)
        else:
            print(" " * indent + f"📄 {item}")


if __name__ == "__main__":
    # Root directory to start from (current directory)
    root_path = os.getcwd()
    
    # Folders to exclude
    exclusions = ['__pycache__', '.git', 'node_modules', 'venv', '.bolt']

    print(f"Directory structure for: {root_path}\n")
    print_directory_structure(root_path, exclusions)
