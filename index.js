const DOMAIN = "zone01normandie.org"
let token
const userQuery = `
  query {
    user {
      id
      attrs
      transactions {
        type
        amount
        path
        createdAt
      }
    }
  }
`;

const skillTypesQuery = `
  query{
  transaction(where: {
              type: {_ilike: "skill_%"}
              },
          ) { 
  type,
  amount,
  createdAt,
  path,
},
}
`;

async function getDataSkill() {
  try {
    const response = await fetch(`https://${DOMAIN}/api/graphql-engine/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query : skillTypesQuery}),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }
    return data.data.transaction;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch data');
  }
}


async function logout() {
  document.querySelector('.content-wrapper').style.display = "none";
  document.querySelector('.logout').style.display = "none";
  document.querySelector('.login').style.display = "block";

  const xpContainer = document.getElementById('xp-container');
  while (xpContainer.firstChild) {
    xpContainer.removeChild(xpContainer.firstChild);
  }
}
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch(`https://${DOMAIN}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    token = await response.json();

    document.querySelector('.logout').style.display = "flex";
    document.querySelector('.content-wrapper').style.display = "flex";
    document.querySelector('.login').style.display = "none";
    document.getElementById('error').innerText = "";

    const user = await getDataUser();
    const data = await getDataXP();
    const skill = await getDataSkill();

    console.log(user);
    console.log(data);
    console.log(skill);

    const test = createGraphXP(data);
    const ratio = createRatio(data);
    const level = createLevel(data);
    console.log("test")

    document.getElementById('resultat').innerText = `XP : ${test}`;
    document.getElementById('id').innerText = `ID : ${user.id}`;

    document.getElementById('ratio').innerText = `Ratio : ${ratio}`;
    console.log("test1")

    document.getElementById('level').innerText = `Level : ${level}`;
    console.log("test2")

    try {
      document.getElementById('name').innerText = `${user.attrs.firstName} ${user.attrs.lastName}`;
      console.log("After setting name innerText");
    } catch (error) {
      console.error("Error setting name innerText:", error);
    }    console.log("test3")

    document.getElementById('welcome').innerText = `Welcome, ${user.attrs.firstName} ${user.attrs.lastName}`;
    console.log("test4")


    console.log("Skill Levels:");
    const skillLevels = createSkills(skill); // Utilisez createSkills avec les données de compétence
    console.log(skillLevels);
    Object.entries(skillLevels).forEach(([skillType, level]) => {
      console.log(`${skillType}: ${level}`);
    });

     await createSkillBarGraph(skillLevels);
  } catch (error) {
    document.getElementById('error').innerText = 'Invalid credentials. Please try again.';
  }
}
async function getDataXP() {
  try {
    const response = await fetch(`https://${DOMAIN}/api/graphql-engine/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: userQuery }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data.data.user[0].transactions;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch data');
  }
}




function createGraphXP(transactions) {
  // Filtrer les transactions pour inclure uniquement celles qui correspondent à certains critères
  const filteredTransactions = transactions.filter(transaction => {
    return transaction.path.includes("/div-01") && !transaction.path.includes("piscine-js/");
  });

  // Filtrer les transactions pour inclure uniquement celles de type "xp"
  const data = filteredTransactions.filter(filteredTransaction => {
    return filteredTransaction.type === "xp";
  });

  // Trier les données par ordre chronologique
  const sortedData = data.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Créer le conteneur SVG
  const svgContainer = document.getElementById('xp-container');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.backgroundColor = 'lightgray'; // Changed background color


  // Créer la ligne du graphique
  const accumulatedValues = [];
  let accumulatedTotal = 0;

  sortedData.forEach((entry, index) => {
    accumulatedTotal += entry.amount;
    accumulatedValues.push({ x: index, y: accumulatedTotal });
  });

  // Calculer les coordonnées des points pour remplir la zone sous la ligne du graphique
  const fillPoints = accumulatedValues.map(entry => `${(entry.x / (sortedData.length - 1)) * svgContainer.clientWidth},${svgContainer.clientHeight - (entry.y / accumulatedTotal) * svgContainer.clientHeight}`).join(' ');

  // Créer le polygone pour remplir la zone sous la ligne du graphique
  const fillArea = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  fillArea.setAttribute('points', `0,${svgContainer.clientHeight} ${fillPoints} ${svgContainer.clientWidth},${svgContainer.clientHeight}`);
  fillArea.setAttribute('fill', 'steelblue'); // Couleur de remplissage bleue
  svg.appendChild(fillArea);

  // Créer la ligne du graphique
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  const points = accumulatedValues.map(entry => `${(entry.x / (sortedData.length - 1)) * svgContainer.clientWidth},${svgContainer.clientHeight - (entry.y / accumulatedTotal) * svgContainer.clientHeight}`);
  line.setAttribute('points', points.join(' '));
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', 'steelblue');
  line.setAttribute('stroke-width', '2');
  svg.appendChild(line);

  // Créer les graduations de l'axe Y
  for (let i = 0; i <= 10; i++) {
    const yAxisTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxisTick.setAttribute('x1', '0');
    yAxisTick.setAttribute('x2', svgContainer.clientWidth);
    yAxisTick.setAttribute('y1', (i / 10) * svgContainer.clientHeight);
    yAxisTick.setAttribute('y2', (i / 10) * svgContainer.clientHeight);
    yAxisTick.setAttribute('stroke', '#ccc');
    svg.appendChild(yAxisTick);

    const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yAxisLabel.setAttribute('x', '5');
    yAxisLabel.setAttribute('y', (i / 10) * svgContainer.clientHeight - 5);
    yAxisLabel.setAttribute('fill', '#333');
    yAxisLabel.textContent = Math.round(accumulatedTotal * (1 - i / 10)); // Calculer les valeurs affichées sur l'axe Y
    svg.appendChild(yAxisLabel);
  }

  // Créer les graduations de l'axe X
  const startDate = new Date(sortedData[0].createdAt);
  const endDate = new Date(sortedData[sortedData.length - 1].createdAt);
  const monthsDifference = monthsBetweenDates(startDate, endDate);
  for (let i = 0; i <= monthsDifference; i++) {
    const dateForTick = new Date(startDate.getTime() + (i / monthsDifference) * (endDate.getTime() - startDate.getTime()));
    const xAxisTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxisTick.setAttribute('x1', (i / monthsDifference) * svgContainer.clientWidth);
    xAxisTick.setAttribute('x2', (i / monthsDifference) * svgContainer.clientWidth);
    xAxisTick.setAttribute('y1', '0');
    xAxisTick.setAttribute('y2', svgContainer.clientHeight);
    xAxisTick.setAttribute('stroke', '#ccc');
    svg.appendChild(xAxisTick);

    const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xAxisLabel.setAttribute('x', (i / monthsDifference) * svgContainer.clientWidth);
    xAxisLabel.setAttribute('y', svgContainer.clientHeight - 5);
    xAxisLabel.setAttribute('fill', '#333');
    xAxisLabel.textContent = formatDate(dateForTick); // Afficher les dates sur l'axe X
    svg.appendChild(xAxisLabel);
  }

  // Ajouter le graphique au conteneur SVG
  svgContainer.appendChild(svg);

  // Retourner la somme totale accumulée
  return accumulatedTotal;
}



function formatDate(date) {
  const options = { month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
function monthsBetweenDates(startDate, endDate) {
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth() +1;
}
async function getDataUser() {
  try {
    const response = await fetch(`https://${DOMAIN}/api/graphql-engine/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: userQuery }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data.data.user[0];
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch user data');
  }
}
function createRatio(transactions){
  let totalXpDown = 0;
  let totalXpUp = 0;
  const xpDown = transactions.filter(transaction => {
    return transaction.type === "down";
  });
  const xpUp = transactions.filter(transaction => {
    return transaction.type === "up";
  });
  xpDown.forEach((entry, index) => {
    totalXpDown += entry.amount;
  });
  xpUp.forEach((entry, index) => {
    totalXpUp += entry.amount;
  });
  if (totalXpUp != 0 && totalXpDown != 0) {
    return (totalXpUp / totalXpDown).toFixed(3);
  } else {
    return 0;
  }
}
function createLevel(transactions){
  let level = 0;
  const filteredTransactions = transactions.filter(transaction => {
    return transaction.path.includes("/div-01") && !transaction.path.includes("piscine-js/");
  });
  const filterLevelTransactions = filteredTransactions.filter(transaction => {
    return transaction.type === "level";
  });
  filterLevelTransactions.forEach((entry, index) => {
    if (entry.amount > level) {
      level = entry.amount;
    }
  });
  return level;
}
function createSkills(transactions) {
  const skillLevels = {};
  transactions.forEach((transaction) => {
    const { type, amount } = transaction;
    if (type.startsWith("skill_")) {
      const skillType = type.replace("skill_", "");
      if (!(skillType in skillLevels) || amount > skillLevels[skillType]) {
        skillLevels[skillType] = amount;
      }
    }
  });
  return skillLevels;
}

async function createSkillBarGraph(skillLevels) {
  console.log("Creating skill bar graph...");
  console.log("Skill levels:", skillLevels);

  const svgContainer = document.getElementById('level-container');
  console.log("SVG Container:", svgContainer);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '500'); // Augmentez la hauteur à 500 pixels par exemple
  svg.style.backgroundColor = 'lightgray'; // Changed background color

  const barHeight = 20; // Height of each bar
  const barSpacing = 5; // Spacing between bars
  const maxBarWidth = svgContainer.clientWidth * 0.8; // Maximum width for bars
  const labelOffset = 5; // Offset for label inside the bar
  const percentageOffset = 10; // Offset for percentage outside the bar

  // Get all skill types
  const allSkills = Object.keys(skillLevels);
  console.log("All skills:", allSkills);

  // Sort the skills by level in descending order
  allSkills.sort((a, b) => skillLevels[b] - skillLevels[a])
  console.log("Sorted skills:", allSkills);

  let yPosition = barSpacing; // Initial y-position

  // Iterate through allSkills to create bars
  allSkills.forEach(skillType => {
    // Get skill level
    const level = skillLevels[skillType];
    console.log("Skill:", skillType, "Level:", level);

    // Calculate width of the bar based on percentage level
    const barWidth = (level / 100) * maxBarWidth;

    // Create bar
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('x', 0);
    bar.setAttribute('y', yPosition);
    bar.setAttribute('width', barWidth);
    bar.setAttribute('height', barHeight);
    bar.setAttribute('fill', 'steelblue'); // Changed bar color
    svg.appendChild(bar);

    // Display skill type label inside the bar
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', labelOffset); // Adjust position inside the bar
    label.setAttribute('y', yPosition + barHeight / 2);
    label.setAttribute('fill', '#333');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('font-size', '12px');
    label.textContent = skillType.toUpperCase(); // Display skill type in uppercase
    svg.appendChild(label);

    // Display percentage outside the bar with offset to the right
    const percentage = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    percentage.setAttribute('x', barWidth + percentageOffset+50); // Adjusted position outside the bar
    percentage.setAttribute('y', yPosition + barHeight / 2);
    percentage.setAttribute('fill', '#333');
    percentage.setAttribute('dominant-baseline', 'middle');
    percentage.setAttribute('font-size', '12px');
    percentage.textContent = `${level}%`; // Display percentage
    svg.appendChild(percentage);

    // Increment y-position for the next bar
    yPosition += barHeight + barSpacing;
  });

  svgContainer.appendChild(svg);
}
