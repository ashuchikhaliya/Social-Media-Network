import networkx as nx
import random
import json
from faker import Faker

fake = Faker()

# Function to generate a random social network graph
def generate_social_network(num_users):
    G = nx.Graph()

    # Ensure there are enough users for potential connections
    if num_users < 5:
        raise ValueError("Number of users should be at least 5 for meaningful connections.")

    # Add nodes representing users
    for i in range(1, num_users + 1):
        G.add_node(i, name=fake.name())  # Generate random names using Faker

    # Add random edges for friendships, followers, likes, etc.
    for user in range(1, num_users + 1):
        # Add friends without repetition
        friends_count = min(random.randint(1, 5), num_users - 1)
        friends = random.sample(list(set(range(1, num_users + 1)) - {user}), friends_count)
        G.add_edges_from([(user, friend) for friend in friends])

    return G

# Generate social network with 20 users (you can adjust the number)
social_network = generate_social_network(10)

# Convert the graph to JSON format
data = {"nodes": [{"id": str(node), "name": social_network.nodes[node]["name"]} for node in social_network.nodes()],
        "links": [{"source": str(edge[0]), "target": str(edge[1]), "relationship": "Friend"} for edge in social_network.edges()]}

# Save the data to a JSON file
with open('social_network_data.json', 'w') as file:
    json.dump(data, file)
