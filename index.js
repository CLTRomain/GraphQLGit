const DOMAIN = "zone01normandie.org"
let token
const query = `
  query {
    transaction {
      type
      amount
      path
      createdAt
    }
  }
`;
const query2 = `
  query {
    user {
      id
      attrs
    }
  }
`;
const skillTypes = [
  "algo",
  "prog",
  "game",
  "ai",
  "stats",
  "tcp",
  "unix",
  "go",
  "js",
  "rust",
  "c",
  "python",
  "php",
  "ruby",
  "sql",
  "html",
  "css",
  "docker",
  "back-end",
  "front-end",
  "sys-admin"
];
async function logout() {
  document.querySelector('.content-wrapper').style.display = "none"
  document.querySelector('.logout').style.display = "none"
  document.querySelector('.login').style.display = "block"
    // Remove the chart
    const xpContainer = document.getElementById('xp-container');
    while (xpContainer.firstChild) {
      xpContainer.removeChild(xpContainer.firstChild);
    }
    const levelContainer = document.getElementById('level-container');
    while (levelContainer.firstChild) {
      levelContainer.removeChild(levelContainer.firstChild);
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
      document.querySelector('.logout').style.display = "none"
      document.querySelector('.personal-info').style.display = "none"
      document.querySelector('.login').style.display = "none"
      document.getElementById('error').innerText = "" 



      const user = await getDataUser() 
      const data = await getDataXP()

      console.log(user)
      console.log(data)

      
    // console.log(user)
    //   const test = createGraphXP(data)
    //   const ratio = createRatio(data)
    //   console.log(ratio)
    //   const level = createLevel(data)
    //   console.log(level)

  
   
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
      body: JSON.stringify({ query }),
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
function createGraphXP(transactions) {
  const filteredTransactions = transactions.filter(transaction => {
    return transaction.path.includes("/div-01") && !transaction.path.includes("piscine-js/");
  });  
  const data = filteredTransactions.filter(filteredTransaction => {
    return filteredTransaction.type === "xp";
  });
  const sortedData = data.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  // Create the SVG container
  const svgContainer = document.getElementById('xp-container');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  // Create the line
  const accumulatedValues = [];
  let accumulatedTotal = 0;
  sortedData.forEach((entry, index) => {
    accumulatedTotal += entry.amount;
    accumulatedValues.push({ x: index, y: accumulatedTotal });
  });
  // Calculate Y-axis step size
  const yAxisStep = Math.ceil(Math.max(accumulatedTotal));
  // Calculate X-axis step size (assuming 30 days per month)
  const dateStep = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  // Calculate the number of months between the start and end date
  const startDate = new Date(sortedData[0].createdAt);
  const endDate = new Date(sortedData[sortedData.length - 1].createdAt);
  const monthsDifference = monthsBetweenDates(startDate, endDate);
  // Create the line
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  const points = accumulatedValues.map(entry => `${(entry.x / (sortedData.length - 1)) * svgContainer.clientWidth},${svgContainer.clientHeight - (entry.y / yAxisStep) * svgContainer.clientHeight}`);
  line.setAttribute('points', points.join(' '));
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', 'steelblue');
  line.setAttribute('stroke-width', '2');
  svg.appendChild(line);
  // Create Y-axis ticks and labels
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
    yAxisLabel.textContent = Math.round(yAxisStep*(10-i)/10);
    svg.appendChild(yAxisLabel);
  }
  // Create X-axis ticks and labels
  for (let i = 0; i <= monthsDifference; i++) {
    const dateForTick = new Date(startDate.getTime() + (i / monthsDifference) * monthsDifference * dateStep);
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
    xAxisLabel.textContent = formatDate(dateForTick);
    svg.appendChild(xAxisLabel);
  }
  svgContainer.appendChild(svg);
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
      body: JSON.stringify({ query: query2 }),
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
    throw new Error('Failed to fetch data');
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
function createSkills(transactions, skillTypes) {
  const skillLevels = {};
  skillTypes.forEach(skillType => {
    let skillLevel = 0;
    const filterSkillTransactions = transactions.filter(transaction => {
      return transaction.type === `skill_${skillType}`;
    });
    filterSkillTransactions.forEach(entry => {
      if (entry.amount > skillLevel) {
        skillLevel = entry.amount;
      }
    });
    skillLevels[skillType] = skillLevel;
  });
  return skillLevels;
}
async function createSkillBarGraph(skillLevels) {
  const svgContainer = document.getElementById('level-container');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  const barWidth = svgContainer.clientWidth / Object.keys(skillLevels).length;
  let index = 0;
  for (const [skillType, level] of Object.entries(skillLevels)) {
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const barHeight = (level / 100) * svgContainer.clientHeight; // Assuming the maximum level is 100 for scaling
    const xPosition = index * barWidth;
    const yPosition = svgContainer.clientHeight - barHeight;
    bar.setAttribute('x', xPosition);
    bar.setAttribute('y', yPosition);
    bar.setAttribute('width', barWidth);
    bar.setAttribute('height', barHeight);
    bar.setAttribute('fill', 'steelblue');
    svg.appendChild(bar);
    // Display skill type labels
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', xPosition + barWidth / 2);
    label.setAttribute('y', svgContainer.clientHeight - 5);
    label.setAttribute('fill', '#333');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = skillType;
    svg.appendChild(label);
    index++;
  }
  // Create Y-axis ticks and labels (adjust as needed)
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
    yAxisLabel.textContent = Math.round(100 * (10 - i) / 10); // Assuming maximum level is 100 for scaling
    svg.appendChild(yAxisLabel);
  }
  svgContainer.appendChild(svg);
}