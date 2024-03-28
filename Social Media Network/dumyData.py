import networkx as nx
import random
import json
from faker import Faker

fake = Faker()

# Function to generate a random user profiles
def social_network_data(num_users):
    G = nx.Graph()

    # Add nodes representing users with profiles
    for i in range(1, num_users + 1):
        profile = {
            "userId": i,
            "username": fake.user_name(),
            "email": fake.email(),
            "bio": fake.sentence(),
            "otherInfo": fake.paragraph(),
        }
        G.add_node(i, name=fake.name(), profile=profile)

    # Add random edges for friendships, followers, likes, etc.
    for user in range(1, num_users + 1):
        # Add friends without repetition
        friends = random.sample(list(set(range(1, num_users + 1)) - {user}), min(random.randint(0, 5), num_users - 1))
        G.add_edges_from([(user, friend) for friend in friends])

       

    return G

# Generate social network with 5 users (you can adjust the number)
social_network = social_network_data(30)

# Convert the graph to JSON format
data = {"nodes": [
        {"id": node, "name": social_network.nodes[node]["name"], "profile": social_network.nodes[node]["profile"]}
        for node in social_network.nodes()],
        "links": [{"source": edge[0], "target": edge[1], "relationship": "Friend"} for edge in social_network.edges()]}

# Save the data to a JSON file
with open('social_network_data.json', 'w') as file:
    json.dump(data, file)
