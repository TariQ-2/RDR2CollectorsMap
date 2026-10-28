
export const colorNameMap: Record<string, string> = {
    '#00ffa2': 'aquagreen', '#ffce70': 'beige', '#292929': 'black', '#31a6c7': 'blue',
    '#7c411f': 'brown', '#416776': 'cadetblue', '#0066a2': 'darkblue', '#627134': 'darkgreen',
    '#e27839': 'darkorange', '#593769': 'darkpurple', '#a13235': 'darkred', '#444444': 'gray',
    '#70ae25': 'green', '#88dbff': 'lightblue', '#5e5e5e': 'lightgray', '#a3c62c': 'lightgreen',
    '#ff8c7d': 'lightorange', '#da4d6d': 'lightred', '#ee9232': 'orange', '#c05b9f': 'pink',
    '#6b65a4': 'purple', '#d43d29': 'red', '#ffffff': 'white', '#ffcc5c': 'yellow',
};

export const colorNameToHexMap: Record<string, string> = Object.fromEntries(
    Object.entries(colorNameMap).map(([hex, name]) => [name, hex]),
);
