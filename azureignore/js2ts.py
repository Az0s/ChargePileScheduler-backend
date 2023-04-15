import os

def rename_files(path):
    for file_name in os.listdir(path):
        new_name = None
        file_path = os.path.join(path, file_name)
        if os.path.isdir(file_path):
            rename_files(file_path)
        # elif file_name.endswith(".")
        elif file_name.endswith('.js'):
            new_name = file_name[:-3] + '.ts'
        if new_name:
            new_path = os.path.join(path, new_name)
            os.rename(file_path, new_path)

if __name__ == '__main__':
    path = '/Users/azus/Documents/Code/node/universal-backend-server/src'
    rename_files(path)