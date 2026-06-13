# Stop all running containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all images (be careful with this one, maybe just dangling or specific ones?)
# The user said "Remove all images". I will remove all.
docker rmi $(docker images -q) -f

# Remove all volumes
docker volume prune -f

# Remove all networks
docker network prune -f

Write-Host "Cleanup complete."
