// Core data structure
let categories = [];
let selectedCategoryId = null;

// DOM elements
const categoriesTree = document.getElementById('categoriesTree');
const categoryEditor = document.getElementById('categoryEditor');
const emptyState = document.getElementById('emptyState');
const breadcrumbsPreview = document.getElementById('breadcrumbsPreview');
const statsContainer = document.getElementById('statsContainer');

// Editor inputs
const nameInput = document.getElementById('nameInput');
const slugInput = document.getElementById('slugInput');
const descriptionInput = document.getElementById('descriptionInput');
const imageUrlInput = document.getElementById('imageUrlInput');
const displayOrderInput = document.getElementById('displayOrderInput');
const levelDisplay = document.getElementById('levelDisplay');

// Buttons
const newCategoryBtn = document.getElementById('newCategoryBtn');
const loadBtn = document.getElementById('loadBtn');
const fileInput = document.getElementById('fileInput');
const saveBtn = document.getElementById('saveBtn');
const saveCategoryBtn = document.getElementById('saveCategory');
const deleteCategoryBtn = document.getElementById('deleteCategory');
const addChildCategoryBtn = document.getElementById('addChildCategory');
const saveToLocalBtn = document.getElementById('saveToLocalBtn');
const loadFromLocalBtn = document.getElementById('loadFromLocalBtn');
const resetLocalBtn = document.getElementById('resetLocalBtn');

// Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Check if slug is unique
function isSlugUnique(slug, excludeId = null) {
  return !categories.some((cat) => cat.slug === slug && cat.id !== excludeId);
}

// Create a new category
function createCategory(name, parentSlug = null) {
  let level = 1; // Root level is now 1 instead of 0
  let parentId = null;

  // Find parent and determine level
  if (parentSlug !== null) {
    const parent = categories.find((cat) => cat.slug === parentSlug);
    if (parent) {
      level = parent.level + 1;
      parentId = parent.id; // Set the parent_id based on parent's id
    } else {
      console.error(`Parent with slug "${parentSlug}" not found`);
      return null;
    }
  }

  // Max level check - now max is level 3
  if (level > 3) {
    alert('Maximum category depth (level 3) reached!');
    return null;
  }

  const baseName = name || 'New Category';
  const baseSlug = generateSlug(baseName);

  // Ensure slug is unique
  let slug = baseSlug;
  let counter = 1;

  while (!isSlugUnique(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Get the maximum display order in the same parent group
  let maxDisplayOrder = 0;
  if (parentSlug === null) {
    // Root categories
    const rootCategories = categories.filter((cat) => cat.parent_slug === null);
    if (rootCategories.length > 0) {
      maxDisplayOrder = Math.max(...rootCategories.map((cat) => cat.display_order || 0));
    }
  } else {
    // Child categories
    const siblings = categories.filter((cat) => cat.parent_slug === parentSlug);
    if (siblings.length > 0) {
      maxDisplayOrder = Math.max(...siblings.map((cat) => cat.display_order || 0));
    }
  }

  const newCategory = {
    id: uuid.v4(),
    name: baseName,
    slug: slug,
    level: level,
    parent_slug: parentSlug,
    parent_id: parentId, // Added parent_id property
    display_order: maxDisplayOrder + 1, // Set display order to be after existing categories
    image_url: '',
    description: '',
    created_at: new Date().toISOString(),
  };

  categories.push(newCategory);
  return newCategory;
}

// Get category by ID
function getCategoryById(id) {
  return categories.find((cat) => cat.id === id);
}

// Get category by slug
function getCategoryBySlug(slug) {
  return categories.find((cat) => cat.slug === slug);
}

// Get children of a category
function getCategoryChildren(parentSlug) {
  // Get children and sort by display_order
  return categories.filter((cat) => cat.parent_slug === parentSlug).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

// Get children of a category by parent ID
function getCategoryChildrenById(parentId) {
  // Get children and sort by display_order
  return categories.filter((cat) => cat.parent_id === parentId).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

// Get breadcrumb path for a category
function getCategoryPath(categoryId) {
  const path = [];
  let current = getCategoryById(categoryId);

  while (current) {
    path.unshift(current);
    current = current.parent_slug ? getCategoryBySlug(current.parent_slug) : null;
  }

  return path;
}

// Update breadcrumbs preview
function updateBreadcrumbs(categoryId) {
  if (!categoryId) {
    breadcrumbsPreview.textContent = 'No category selected';
    return;
  }

  const path = getCategoryPath(categoryId);
  breadcrumbsPreview.innerHTML = path
    .map((cat, index) => {
      const isLast = index === path.length - 1;
      return `<span class="${isLast ? 'font-semibold text-gray-800' : 'text-gray-600'}">${cat.name}</span>` + (isLast ? '' : ' <span class="mx-1">/</span> ');
    })
    .join('');
}

// Update stats display
function updateStats() {
  // Calculate statistics
  const totalCategories = categories.length;

  // Count categories by level (now levels 1, 2, 3)
  const levelCounts = [0, 0, 0, 0]; // Index 1 = level 1, index 2 = level 2, etc.

  categories.forEach((cat) => {
    if (cat.level >= 1 && cat.level <= 3) {
      levelCounts[cat.level]++;
    }
  });

  // Update the stats container with color-coded statistics
  statsContainer.innerHTML = `
  <div class="stat bg-white rounded-md p-4 shadow text-center">
    <div class="stat-title text-sm text-gray-600 mb-1">Total Categories</div>
    <div class="stat-value text-2xl font-semibold text-purple-600">${totalCategories}</div>
  </div>
  <div class="stat bg-white rounded-md p-4 shadow text-center">
    <div class="stat-title text-sm text-gray-600 mb-1">Level 1</div>
    <div class="stat-value text-2xl font-semibold text-green-600">${levelCounts[1]}</div>
  </div>
  <div class="stat bg-white rounded-md p-4 shadow text-center">
    <div class="stat-title text-sm text-gray-600 mb-1">Level 2</div>
    <div class="stat-value text-2xl font-semibold text-sky-600">${levelCounts[2]}</div>
  </div>
  <div class="stat bg-white rounded-md p-4 shadow text-center">
    <div class="stat-title text-sm text-gray-600 mb-1">Level 3</div>
    <div class="stat-value text-2xl font-semibold text-orange-600">${levelCounts[3]}</div>
  </div>
`;
}

// Render the categories tree
function renderCategoriesTree() {
  // Get root categories (now level 1) and sort by display order
  const rootCategories = categories.filter((cat) => cat.parent_slug === null).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  // Clear existing tree
  categoriesTree.innerHTML = '';

  // Recursive function to render categories and their children
  function renderCategory(category, container) {
    const children = getCategoryChildren(category.slug);

    let categoryColor;

    if (category.level === 1) {
      categoryColor = 'text-green-600';
    } else if (category.level === 2) {
      categoryColor = 'text-sky-600';
    } else if (category.level === 3) {
      categoryColor = 'text-orange-600';
    }

    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item mt-2';
    categoryItem.innerHTML = `
            <div class="flex items-center group">
                <div class="cursor-pointer py-1 category-name flex-grow ${categoryColor}"><span class="p-1 ${
      category.id === selectedCategoryId ? 'font-semibold bg-gray-100/70  rounded' : ''
    }">${category.name}</span></div>
                <div class="text-xs text-gray-500 ml-2 ">${category.slug}</div>
                <div class="text-xs ml-2 bg-gray-100 px-1 rounded">#${category.display_order || 0}</div>
            </div>
        `;

    // Add click handler for selection
    const categoryName = categoryItem.querySelector('.category-name');
    categoryName.addEventListener('click', () => {
      selectCategory(category.id);
    });

    container.appendChild(categoryItem);

    // If there are children, create a container for them
    if (children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'pl-4 border-l border-gray-200 mt-1';
      categoryItem.appendChild(childrenContainer);

      // Render each child
      children.forEach((child) => renderCategory(child, childrenContainer));
    }
  }

  // Render root categories
  rootCategories.forEach((rootCat) => renderCategory(rootCat, categoriesTree));

  // Show empty message if no categories
  if (rootCategories.length === 0) {
    categoriesTree.innerHTML = '<div class="text-gray-500 text-sm italic">No categories yet. Click "Add Root Category" to get started.</div>';
  }

  // Update statistics
  updateStats();
}

// Select a category for editing
function selectCategory(categoryId) {
  selectedCategoryId = categoryId;
  updateBreadcrumbs(categoryId);

  if (categoryId) {
    const category = getCategoryById(categoryId);

    // Fill the form
    nameInput.value = category.name;
    slugInput.value = category.slug;
    descriptionInput.value = category.description || '';
    imageUrlInput.value = category.image_url || '';
    displayOrderInput.value = category.display_order || 0;
    levelDisplay.textContent = category.level;

    // Update slug preview
    document.querySelector('#slugPreview').textContent = category.slug;

    // Show editor, hide empty state
    categoryEditor.classList.remove('hidden');
    emptyState.classList.add('hidden');
  } else {
    // Hide editor, show empty state
    categoryEditor.classList.add('hidden');
    emptyState.classList.remove('hidden');
  }

  renderCategoriesTree();
}

// Delete a category and all its children
function deleteCategory(categoryId) {
  const categoryToDelete = getCategoryById(categoryId);
  if (!categoryToDelete) return;

  const slugToDelete = categoryToDelete.slug;
  const idToDelete = categoryToDelete.id;

  // Get all descendant ids recursively
  function getAllDescendantSlugs(slug) {
    const directChildren = categories.filter((cat) => cat.parent_slug === slug);
    const childrenSlugs = directChildren.map((child) => child.slug);
    const descendantSlugs = [...childrenSlugs];

    childrenSlugs.forEach((childSlug) => {
      descendantSlugs.push(...getAllDescendantSlugs(childSlug));
    });

    return descendantSlugs;
  }

  // Get all descendant ids recursively using parent_id
  function getAllDescendantIds(id) {
    const directChildren = categories.filter((cat) => cat.parent_id === id);
    const childrenIds = directChildren.map((child) => child.id);
    const descendantIds = [...childrenIds];

    childrenIds.forEach((childId) => {
      descendantIds.push(...getAllDescendantIds(childId));
    });

    return descendantIds;
  }

  // Get descendant slugs and ids
  const allSlugs = [slugToDelete, ...getAllDescendantSlugs(slugToDelete)];
  const allIds = [idToDelete, ...getAllDescendantIds(idToDelete)];

  // Combine both methods to ensure we catch all descendants
  const allCategoriesToDelete = categories.filter((cat) => allSlugs.includes(cat.slug) || allIds.includes(cat.id)).map((cat) => cat.id);

  // Remove all categories
  categories = categories.filter((cat) => !allCategoriesToDelete.includes(cat.id));

  // Deselect
  selectCategory(null);
}

// Update category slug in real-time based on name
function updateSlugFromName() {
  const newSlug = generateSlug(nameInput.value);

  // Check if this slug already exists (excluding current category)
  if (selectedCategoryId && !isSlugUnique(newSlug, selectedCategoryId)) {
    // If not unique, don't update the input field yet but show in preview with warning
    document.querySelector('#slugPreview').textContent = `${newSlug} (already exists)`;
    document.querySelector('#slugPreview').classList.add('text-red-500');
  } else {
    slugInput.value = newSlug;
    document.querySelector('#slugPreview').textContent = newSlug;
    document.querySelector('#slugPreview').classList.remove('text-red-500');
  }
}

// Validate slug uniqueness
function validateSlug() {
  const slug = slugInput.value;
  if (!selectedCategoryId) return true;

  if (!isSlugUnique(slug, selectedCategoryId)) {
    slugInput.classList.add('border-red-500');
    document.querySelector('#slugPreview').textContent = `${slug} (already exists)`;
    document.querySelector('#slugPreview').classList.add('text-red-500');
    return false;
  } else {
    slugInput.classList.remove('border-red-500');
    document.querySelector('#slugPreview').textContent = slug;
    document.querySelector('#slugPreview').classList.remove('text-red-500');
    return true;
  }
}

// Validate display order is a positive number
function validateDisplayOrder() {
  const displayOrder = parseInt(displayOrderInput.value);
  if (isNaN(displayOrder) || displayOrder < 0) {
    displayOrderInput.classList.add('border-red-500');
    return false;
  } else {
    displayOrderInput.classList.remove('border-red-500');
    return true;
  }
}

// Update children references when parent slug changes
function updateChildrenReferences(oldSlug, newSlug, categoryId) {
  categories.forEach((category) => {
    if (category.parent_slug === oldSlug) {
      category.parent_slug = newSlug;
      category.parent_id = categoryId;
    }
  });
}

// LocalStorage Functions
function saveToLocalStorage() {
  try {
    localStorage.setItem('categoryManagerData', JSON.stringify(categories));
    alert('Categories saved to local storage successfully!');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    alert('Error saving to local storage: ' + error.message);
  }
}

function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('categoryManagerData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (Array.isArray(parsedData)) {
        categories = parsedData;

        // Ensure display_order exists for all categories
        categories.forEach((cat) => {
          if (cat.display_order === undefined) {
            cat.display_order = 0;
          }
        });

        renderCategoriesTree();
        selectCategory(null);
        return true;
      } else {
        throw new Error('Invalid data format in local storage');
      }
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return false;
}

function manualLoadFromLocalStorage() {
  if (loadFromLocalStorage()) {
    alert('Categories loaded from local storage successfully!');
  } else {
    alert('No data found in local storage or invalid format');
  }
}

function resetLocalStorage() {
  if (confirm('Are you sure you want to clear all data from local storage? This cannot be undone.')) {
    try {
      localStorage.removeItem('categoryManagerData');
      alert('Local storage data cleared successfully!');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      alert('Error clearing local storage: ' + error.message);
    }
  }
}

// Event listeners

// Name input - auto generate slug in real-time
nameInput.addEventListener('input', updateSlugFromName);

// Slug input - validate uniqueness
slugInput.addEventListener('input', validateSlug);

// Display order input - validate numeric
displayOrderInput.addEventListener('input', validateDisplayOrder);

// Save category changes
saveCategoryBtn.addEventListener('click', () => {
  if (!selectedCategoryId) return;

  // Validate slug uniqueness
  if (!validateSlug()) {
    alert('Slug must be unique. Please choose a different name or edit the slug directly.');
    return;
  }

  // Validate display order
  if (!validateDisplayOrder()) {
    alert('Display order must be a positive number.');
    return;
  }

  const category = getCategoryById(selectedCategoryId);
  const oldSlug = category.slug;
  const newSlug = slugInput.value;

  category.name = nameInput.value;
  category.slug = newSlug;
  category.description = descriptionInput.value;
  category.image_url = imageUrlInput.value;
  category.display_order = parseInt(displayOrderInput.value) || 0;

  // Update children references if slug changed
  if (oldSlug !== newSlug) {
    updateChildrenReferences(oldSlug, newSlug, category.id);
  }

  renderCategoriesTree();
  updateBreadcrumbs(selectedCategoryId);
});

// Delete category
deleteCategoryBtn.addEventListener('click', () => {
  if (!selectedCategoryId) return;

  if (confirm('Are you sure you want to delete this category and all its subcategories?')) {
    deleteCategory(selectedCategoryId);
  }
});

// Add child category
addChildCategoryBtn.addEventListener('click', () => {
  if (!selectedCategoryId) return;

  const parent = getCategoryById(selectedCategoryId);

  // Check max level - now max is level 3
  if (parent.level >= 3) {
    alert('Maximum category depth (level 3) reached!');
    return;
  }

  const newCategory = createCategory('New Child Category', parent.slug);
  if (newCategory) {
    renderCategoriesTree();
    selectCategory(newCategory.id);
  }
});

// Add root category
newCategoryBtn.addEventListener('click', () => {
  const newCategory = createCategory('New Root Category');
  renderCategoriesTree();
  selectCategory(newCategory.id);
});

// Save to JSON
saveBtn.addEventListener('click', () => {
  if (categories.length === 0) {
    alert('No categories to save!');
    return;
  }

  // Generate timestamp for filename in format dd-mm-yyyy-hh-mm-ss
  const now = new Date();
  const timestamp = [
    now.getDate().toString().padStart(2, '0'),
    (now.getMonth() + 1).toString().padStart(2, '0'),
    now.getFullYear(),
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0'),
  ].join('-');

  // Prepare JSON
  const jsonData = JSON.stringify(categories, null, 2);

  // Create download link
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `categories-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Load JSON file handler
loadBtn.addEventListener('click', () => {
  fileInput.click();
});

// File input change
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const loadedCategories = JSON.parse(e.target.result);

      // Basic validation
      if (!Array.isArray(loadedCategories)) {
        throw new Error('Invalid JSON format: expected an array');
      }

      // Check required fields and handle possible old format
      for (const cat of loadedCategories) {
        if (!cat.id || !cat.name || cat.level === undefined) {
          throw new Error('Invalid category data: missing required fields');
        }

        // Set proper parent relationships
        // If parent_slug exists but parent_id doesn't
        if (cat.parent_slug && !cat.parent_id) {
          const parent = loadedCategories.find((p) => p.slug === cat.parent_slug);
          if (parent) {
            cat.parent_id = parent.id;
          }
        }
        // If parent_id exists but parent_slug doesn't
        else if (cat.parent_id && !cat.parent_slug) {
          const parent = loadedCategories.find((p) => p.id === cat.parent_id);
          if (parent) {
            cat.parent_slug = parent.slug;
          } else {
            cat.parent_slug = null;
            cat.parent_id = null;
          }
        }

        // Ensure parent_slug and parent_id exist (might be null)
        if (cat.parent_slug === undefined) {
          cat.parent_slug = null;
        }
        if (cat.parent_id === undefined) {
          cat.parent_id = null;
        }

        // Handle level adjustment from old level system (0-based) to new level system (1-based)
        if (cat.level === 0) {
          cat.level = 1; // Convert old level 0 to new level 1
        }

        // Ensure level is within allowed range (1-3)
        if (cat.level < 1) {
          cat.level = 1;
        } else if (cat.level > 3) {
          cat.level = 3;
        }

        // Ensure display_order exists
        if (cat.display_order === undefined) {
          cat.display_order = 0;
        }
      }

      // Replace categories
      categories = loadedCategories;

      renderCategoriesTree();
      selectCategory(null);

      alert('Categories loaded successfully!');
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Error loading categories: ' + error.message);
    }
  };
  reader.readAsText(file);
});

// Local storage buttons
saveToLocalBtn.addEventListener('click', saveToLocalStorage);
loadFromLocalBtn.addEventListener('click', manualLoadFromLocalStorage);
resetLocalBtn.addEventListener('click', resetLocalStorage);

// Initialize the UI
// Try to load from localStorage first
if (!loadFromLocalStorage()) {
  // If no localStorage data, start with empty state
  renderCategoriesTree();
  selectCategory(null);
}
updateStats();
