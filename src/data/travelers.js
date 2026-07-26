
export const travelers = Array.from({ length: 80 }).map((_, i) => {
  const regions = [
    { flag: '🇺🇸', nat: 'USA', names: ['Alex', 'Jordan', 'Sam', 'Taylor', 'Casey', 'Riley'] },
    { flag: '🇬🇧', nat: 'UK', names: ['Oliver', 'Harry', 'George', 'Noah', 'Jack', 'Charlie'] },
    { flag: '🇨🇦', nat: 'Canada', names: ['Liam', 'William', 'James', 'Logan', 'Benjamin'] },
    { flag: '🇦🇺', nat: 'Australia', names: ['Lucas', 'Ethan', 'Thomas', 'Jackson', 'Henry'] },
    { flag: '🇯🇵', nat: 'Japan', names: ['Yuki', 'Kenji', 'Sora', 'Haru', 'Riku'] },
    { flag: '🇫🇷', nat: 'France', names: ['Lucas', 'Hugo', 'Arthur', 'Enzo', 'Louis'] },
    { flag: '🇧🇷', nat: 'Brazil', names: ['Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Davi'] },
    { flag: '🇿🇦', nat: 'South Africa', names: ['Thabo', 'Siyabonga', 'Junior', 'Bandile'] },
    { flag: '🇦🇪', nat: 'UAE', names: ['Omar', 'Ali', 'Zayed', 'Rashid'] }
  ];
  const region = regions[i % regions.length];
  const name = region.names[i % region.names.length];
  
  const colors = ['#E57373', '#F06292', '#BA68C8', '#9575CD', '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC', '#81C784', '#AED581', '#DCE775', '#FFF176', '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F', '#E0E0E0', '#90A4AE'];

  const foodPrefs = [['BBQ', 'Spicy'], ['Vegetarian', 'Mild'], ['Street Food', 'Dessert'], ['Seafood', 'BBQ'], ['Halal', 'Mild']];
  const langs = [['English'], ['English', 'Spanish'], ['English', 'French'], ['English', 'Japanese'], ['English', 'Arabic'], ['English', 'Portuguese']];

  return {
    id: `t${i}`,
    name: name,
    age: 20 + (i % 15),
    nationality: region.nat,
    flag: region.flag,
    color: colors[i % colors.length],
    bio: `Hi! I'm traveling around Asia and loving it here. Always down for good food and great company! Let's explore together.`,
    currentLocation: 'Seoul',
    tripDates: 'Jul 20 - Jul 30',
    daysLeft: 5 + (i % 5),
    availableToday: i % 3 === 0,
    interests: ['Photography', 'Culture', 'Cafe Hopping', 'History'],
    foodPreferences: foodPrefs[i % foodPrefs.length],
    languages: langs[i % langs.length],
    wantToVisit: ['Hongdae', 'Itaewon', 'Gangnam', 'Myeongdong']
  };
});

export function commonInterests(traveler) {
  // Mock common interests logic
  return traveler.interests.slice(0, 2);
}

export function getTraveler(id) {
  return travelers.find(t => t.id === id);
}
