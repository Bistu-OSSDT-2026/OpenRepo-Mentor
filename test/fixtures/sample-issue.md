# Bug: CLI crashes on Windows paths

The `pathMention` tool crashes when users mention paths with backslashes on Windows.
We should normalize the path separator before matching.
