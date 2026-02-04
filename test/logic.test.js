/**
 * ShopQ Business Logic Tests
 * 
 * Tests the client-side JavaScript functions for list management.
 * Since the app uses localStorage, we mock it for testing.
 */

const assert = require('assert');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => store[key] = value,
    removeItem: (key) => delete store[key],
    clear: () => store = {}
  };
})();

// Categories matching the app
const CATEGORIES = [
  { id: 'produce', name: '🥬 Produce' },
  { id: 'dairy', name: '🥛 Dairy' },
  { id: 'meat', name: '🥩 Meat' },
  { id: 'bakery', name: '🍞 Bakery' },
  { id: 'frozen', name: '🧊 Frozen' },
  { id: 'pantry', name: '🥫 Pantry' },
  { id: 'beverages', name: '🥤 Beverages' },
  { id: 'other', name: '📦 Other' }
];

const COMMON_ITEMS = [
  { name: 'Milk', category: 'dairy' },
  { name: 'Eggs', category: 'dairy' },
  { name: 'Bread', category: 'bakery' },
  { name: 'Butter', category: 'dairy' },
  { name: 'Cheese', category: 'dairy' },
  { name: 'Chicken', category: 'meat' },
  { name: 'Apples', category: 'produce' },
  { name: 'Bananas', category: 'produce' }
];

// Extracted/reimplemented functions from client-side JS
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createList(name) {
  return {
    id: generateId(),
    name: name,
    items: []
  };
}

function createItem(name, category) {
  return {
    id: generateId(),
    name: name,
    category: category || 'other',
    done: false,
    createdAt: Date.now()
  };
}

function findCategory(itemName) {
  const common = COMMON_ITEMS.find(i => 
    i.name.toLowerCase() === itemName.toLowerCase()
  );
  return common ? common.category : 'other';
}

function filterItemsByCategory(items, category) {
  if (category === 'all') return items;
  return items.filter(i => i.category === category);
}

function groupItemsByCategory(items) {
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });
  return grouped;
}

function countCompleted(items) {
  return items.filter(i => i.done).length;
}

function clearCompleted(items) {
  return items.filter(i => !i.done);
}

function encodeListForShare(list) {
  const data = {
    name: list.name,
    items: list.items.map(i => ({ name: i.name, category: i.category }))
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeSharedList(encoded) {
  try {
    const json = Buffer.from(encoded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Autocomplete matching logic
function matchAutocomplete(query, items) {
  const lowerQuery = query.toLowerCase();
  const seen = new Set();
  return items.filter(item => {
    const lower = item.name.toLowerCase();
    if (seen.has(lower)) return false;
    if (!lower.includes(lowerQuery)) return false;
    seen.add(lower);
    return true;
  });
}

describe('ShopQ Logic', function() {
  beforeEach(function() {
    localStorageMock.clear();
  });
  
  describe('ID Generation', function() {
    it('should generate unique IDs', function() {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      assert.strictEqual(ids.size, 100, 'All IDs should be unique');
    });
    
    it('should generate string IDs', function() {
      const id = generateId();
      assert.strictEqual(typeof id, 'string');
      assert(id.length > 0);
    });
  });
  
  describe('List Management', function() {
    it('should create a list with name and empty items', function() {
      const list = createList('Groceries');
      assert.strictEqual(list.name, 'Groceries');
      assert(Array.isArray(list.items));
      assert.strictEqual(list.items.length, 0);
      assert(list.id);
    });
    
    it('should create items with required properties', function() {
      const item = createItem('Milk', 'dairy');
      assert.strictEqual(item.name, 'Milk');
      assert.strictEqual(item.category, 'dairy');
      assert.strictEqual(item.done, false);
      assert(item.id);
      assert(item.createdAt);
    });
    
    it('should default to "other" category if not specified', function() {
      const item = createItem('Random Thing');
      assert.strictEqual(item.category, 'other');
    });
  });
  
  describe('Category Detection', function() {
    it('should detect dairy items', function() {
      assert.strictEqual(findCategory('Milk'), 'dairy');
      assert.strictEqual(findCategory('Eggs'), 'dairy');
      assert.strictEqual(findCategory('Cheese'), 'dairy');
    });
    
    it('should detect produce items', function() {
      assert.strictEqual(findCategory('Apples'), 'produce');
      assert.strictEqual(findCategory('Bananas'), 'produce');
    });
    
    it('should detect meat items', function() {
      assert.strictEqual(findCategory('Chicken'), 'meat');
    });
    
    it('should be case-insensitive', function() {
      assert.strictEqual(findCategory('MILK'), 'dairy');
      assert.strictEqual(findCategory('milk'), 'dairy');
      assert.strictEqual(findCategory('MiLk'), 'dairy');
    });
    
    it('should return "other" for unknown items', function() {
      assert.strictEqual(findCategory('Toilet Paper'), 'other');
      assert.strictEqual(findCategory('Mystery Item'), 'other');
    });
  });
  
  describe('Item Filtering', function() {
    const items = [
      { id: '1', name: 'Milk', category: 'dairy', done: false },
      { id: '2', name: 'Eggs', category: 'dairy', done: true },
      { id: '3', name: 'Bread', category: 'bakery', done: false },
      { id: '4', name: 'Apples', category: 'produce', done: false }
    ];
    
    it('should return all items when filter is "all"', function() {
      const result = filterItemsByCategory(items, 'all');
      assert.strictEqual(result.length, 4);
    });
    
    it('should filter by specific category', function() {
      const dairy = filterItemsByCategory(items, 'dairy');
      assert.strictEqual(dairy.length, 2);
      assert(dairy.every(i => i.category === 'dairy'));
    });
    
    it('should return empty array for category with no items', function() {
      const frozen = filterItemsByCategory(items, 'frozen');
      assert.strictEqual(frozen.length, 0);
    });
  });
  
  describe('Item Grouping', function() {
    const items = [
      { id: '1', name: 'Milk', category: 'dairy' },
      { id: '2', name: 'Eggs', category: 'dairy' },
      { id: '3', name: 'Bread', category: 'bakery' },
      { id: '4', name: 'Apples', category: 'produce' }
    ];
    
    it('should group items by category', function() {
      const grouped = groupItemsByCategory(items);
      assert.strictEqual(grouped.dairy.length, 2);
      assert.strictEqual(grouped.bakery.length, 1);
      assert.strictEqual(grouped.produce.length, 1);
    });
    
    it('should handle empty items array', function() {
      const grouped = groupItemsByCategory([]);
      assert.deepStrictEqual(grouped, {});
    });
  });
  
  describe('Completed Items', function() {
    const items = [
      { id: '1', name: 'Milk', done: false },
      { id: '2', name: 'Eggs', done: true },
      { id: '3', name: 'Bread', done: true },
      { id: '4', name: 'Apples', done: false }
    ];
    
    it('should count completed items', function() {
      assert.strictEqual(countCompleted(items), 2);
    });
    
    it('should return 0 for no completed items', function() {
      const uncompleted = items.map(i => ({ ...i, done: false }));
      assert.strictEqual(countCompleted(uncompleted), 0);
    });
    
    it('should clear completed items', function() {
      const remaining = clearCompleted(items);
      assert.strictEqual(remaining.length, 2);
      assert(remaining.every(i => !i.done));
    });
  });
  
  describe('List Sharing', function() {
    it('should encode list for sharing', function() {
      const list = {
        name: 'Weekly Shop',
        items: [
          { id: '1', name: 'Milk', category: 'dairy', done: false },
          { id: '2', name: 'Bread', category: 'bakery', done: true }
        ]
      };
      
      const encoded = encodeListForShare(list);
      assert(typeof encoded === 'string');
      assert(encoded.length > 0);
    });
    
    it('should decode shared list', function() {
      const list = {
        name: 'Weekly Shop',
        items: [
          { name: 'Milk', category: 'dairy' },
          { name: 'Bread', category: 'bakery' }
        ]
      };
      
      const encoded = encodeListForShare(list);
      const decoded = decodeSharedList(encoded);
      
      assert.strictEqual(decoded.name, 'Weekly Shop');
      assert.strictEqual(decoded.items.length, 2);
      assert.strictEqual(decoded.items[0].name, 'Milk');
    });
    
    it('should return null for invalid encoded data', function() {
      const decoded = decodeSharedList('not-valid-base64!!!');
      assert.strictEqual(decoded, null);
    });
    
    it('should handle empty list', function() {
      const list = { name: 'Empty', items: [] };
      const encoded = encodeListForShare(list);
      const decoded = decodeSharedList(encoded);
      
      assert.strictEqual(decoded.name, 'Empty');
      assert.strictEqual(decoded.items.length, 0);
    });
  });
  
  describe('HTML Escaping', function() {
    it('should escape HTML special characters', function() {
      assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
      assert.strictEqual(escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
      assert.strictEqual(escapeHtml('"quoted"'), '&quot;quoted&quot;');
    });
    
    it('should handle normal text unchanged', function() {
      assert.strictEqual(escapeHtml('Milk'), 'Milk');
      assert.strictEqual(escapeHtml('2% Milk'), '2% Milk');
    });
  });
  
  describe('Autocomplete', function() {
    it('should match items by substring', function() {
      const matches = matchAutocomplete('mil', COMMON_ITEMS);
      assert.strictEqual(matches.length, 1);
      assert.strictEqual(matches[0].name, 'Milk');
    });
    
    it('should be case-insensitive', function() {
      const matches = matchAutocomplete('MILK', COMMON_ITEMS);
      assert.strictEqual(matches.length, 1);
    });
    
    it('should match multiple items', function() {
      const matches = matchAutocomplete('e', COMMON_ITEMS);
      // Eggs, Cheese, Apples all contain 'e'
      assert(matches.length >= 3);
    });
    
    it('should deduplicate results', function() {
      const duplicateItems = [
        { name: 'Milk', category: 'dairy' },
        { name: 'Milk', category: 'dairy' }, // duplicate
        { name: 'MILK', category: 'dairy' }  // case variant
      ];
      const matches = matchAutocomplete('mil', duplicateItems);
      assert.strictEqual(matches.length, 1);
    });
    
    it('should return empty for no matches', function() {
      const matches = matchAutocomplete('xyz123', COMMON_ITEMS);
      assert.strictEqual(matches.length, 0);
    });
  });
  
  describe('Category Data', function() {
    it('should have 8 categories', function() {
      assert.strictEqual(CATEGORIES.length, 8);
    });
    
    it('should have unique category IDs', function() {
      const ids = CATEGORIES.map(c => c.id);
      const unique = new Set(ids);
      assert.strictEqual(unique.size, ids.length);
    });
    
    it('should have emoji in category names', function() {
      CATEGORIES.forEach(cat => {
        assert(cat.name.length > cat.id.length, `Category ${cat.id} should have emoji`);
      });
    });
  });
});
