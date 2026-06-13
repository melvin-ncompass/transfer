FROM apache/nifi:latest

# Create destination folder and copy the user's folder into it
USER root
RUN mkdir -p /opt/nifi/custom
COPY apache_NIFI/ /opt/nifi/custom/

# Ensure NiFi user owns the files (NiFi container runs as 'nifi')
RUN chown -R nifi:nifi /opt/nifi/custom

USER nifi
