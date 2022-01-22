# logfile-service
Logfile Service

Service for quick and simple data logging into date bound logfile.
Logs are written into single file for all cluster nodes.
If cluster option is selected then logs are written into separate files.


## Logfile Service

### Logfile_Service.logfile_directory
Logfile directory

### Logfile_Service.logfile_tag
Logfile tag

### Logfile_Service.logfile_extension
Logfile extension

### Logfile_Service.is_cluster
True if each cluster node to log into separate logfile

### Logfile_Service.is_stack
True if error stack trace is logged

### Logfile_Service.is_utc
True if date and time values are UTC

### Logfile_Service.log
Writes time indexed text with optional error into date bound logfile
