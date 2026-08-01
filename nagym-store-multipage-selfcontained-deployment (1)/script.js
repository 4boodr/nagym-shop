const body = document.body;
    const overlay = document.getElementById('overlay');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartBody = document.getElementById('cartBody');
    const cartTitle = document.getElementById('cartTitle');
    const mobileNav = document.getElementById('mobileNav');
    const searchPanel = document.getElementById('searchPanel');
    const megaMenu = document.getElementById('megaMenu');
    const shopButton = document.querySelector('[data-menu="shop"]');
    const cartCount = document.querySelector('.cart-count');
    const PRODUCTS = {
      'compression-short': { name: 'NAGYM Compression Shirt', price: 35 },
      'long-sleeve-compression': { name: 'NAGYM Long Sleeve Compression Shirt', price: 40 },
      'womens-contour-shorts': { name: 'NAGYM Contour Shorts', price: 45 }
    };

    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('nagymCart') || '[]');
      if (!Array.isArray(cart)) cart = [];
    } catch (_) {
      cart = [];
    }

    const money = value => `$${Number(value).toFixed(2)}`;
    const saveCart = () => localStorage.setItem('nagymCart', JSON.stringify(cart));
    const cartQuantity = () => cart.reduce((total, item) => total + item.quantity, 0);

    const setOverlay = open => {
      overlay.classList.toggle('open', open);
      body.classList.toggle('locked', open);
    };

    const closeAll = () => {
      cartDrawer.classList.remove('open');
      mobileNav.classList.remove('open');
      searchPanel.classList.remove('open');
      megaMenu.classList.remove('open');
      cartDrawer.setAttribute('aria-hidden', 'true');
      mobileNav.setAttribute('aria-hidden', 'true');
      searchPanel.setAttribute('aria-hidden', 'true');
      megaMenu.setAttribute('aria-hidden', 'true');
      setOverlay(false);
    };

    const openCart = () => {
      window.location.href = './cart.html';
    };

    const renderCart = () => {
      const quantity = cartQuantity();
      cartCount.textContent = quantity;
      cartTitle.textContent = `Your bag · ${quantity}`;

      if (!cart.length) {
        cartBody.innerHTML = `
          <div class="cart-empty">
            <div class="empty-icon">＋</div>
            <h2>Your bag is empty</h2>
            <p>Add a product and it will appear here.</p>
            <a class="button" href="./men.html#mens-tshirts" id="cartContinue">Shop compression shirts</a>
          </div>`;
        document.getElementById('cartContinue').addEventListener('click', closeAll);
        return;
      }

      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const items = cart.map((item, index) => `
        <article class="cart-item">
          <img src="${item.image}" alt="${item.color} ${item.name}" />
          <div>
            <div class="cart-item-top">
              <div>
                <h3>${item.name}</h3>
                <p class="cart-item-meta">${item.color} · Size ${item.size}</p>
              </div>
              <p class="cart-item-price">${money(item.price * item.quantity)}</p>
            </div>
            <div class="cart-item-actions">
              <div class="quantity-control" aria-label="Quantity">
                <button type="button" data-cart-action="decrease" data-index="${index}" aria-label="Decrease quantity">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-cart-action="increase" data-index="${index}" aria-label="Increase quantity">＋</button>
              </div>
              <button class="remove-item" type="button" data-cart-action="remove" data-index="${index}">Remove</button>
            </div>
          </div>
        </article>`).join('');

      cartBody.innerHTML = `
        <div class="cart-items">${items}</div>
        <div class="cart-summary">
          <div class="cart-total"><span>Subtotal</span><span>${money(total)}</span></div>
          <button class="button" type="button" id="checkoutButton" disabled>Checkout coming soon</button>
          <small>Checkout and payment connection will be added in a later deployment.</small>
        </div>`;

      cartBody.querySelectorAll('[data-cart-action]').forEach(button => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.index);
          const action = button.dataset.cartAction;
          if (!cart[index]) return;
          if (action === 'increase') cart[index].quantity += 1;
          if (action === 'decrease') cart[index].quantity -= 1;
          if (action === 'remove' || cart[index].quantity <= 0) cart.splice(index, 1);
          saveCart();
          renderCart();
        });
      });
    };

    document.querySelectorAll('.product-card').forEach(card => {
      const media = card.querySelector('.product-media');
      const addButton = card.querySelector('.add-to-cart');
      const note = card.querySelector('.selection-note');
      const product = PRODUCTS[card.dataset.productId];
      const colourButtons = card.querySelectorAll('.colour-button');
      const isPreview = card.dataset.preview === 'true';
      let selectedSize = '';
      let selectedColor = card.dataset.color || 'Black';

      const slugifyColor = value => value.toLowerCase().replace(/\s+/g, '-');

      const selectedPrimaryImage = () => {
        const colourClass = slugifyColor(selectedColor);
        return card.querySelector(`.${colourClass}-image.product-image-primary`) ||
          card.querySelector('.product-image-primary');
      };

      media.addEventListener('click', () => media.classList.toggle('side-view'));

      if (isPreview) {
        return;
      }

      colourButtons.forEach(button => {
        button.addEventListener('click', () => {
          selectedColor = button.dataset.colour;
          card.dataset.color = selectedColor;
          media.classList.remove('side-view');
          media.setAttribute(
            'aria-label',
            `Switch between front and side views of the ${selectedColor} ${product.name}`
          );

          colourButtons.forEach(option => {
            const isSelected = option === button;
            option.classList.toggle('selected', isSelected);
            option.setAttribute('aria-pressed', String(isSelected));
          });

          const colourMeta = card.querySelector('.colour-meta');
          if (colourMeta) {
            const chip = colourMeta.querySelector('.colour-chip');
            const label = colourMeta.querySelector('span:last-child');
            if (chip) chip.className = `colour-chip ${slugifyColor(selectedColor)}`;
            if (label) label.textContent = selectedColor;
          }

          note.textContent = selectedSize
            ? `${selectedColor}, size ${selectedSize} selected`
            : `${selectedColor} selected — choose a size`;
        });
      });

      card.querySelectorAll('.size-button').forEach(button => {
        button.addEventListener('click', () => {
          card.querySelectorAll('.size-button').forEach(option => option.classList.remove('selected'));
          button.classList.add('selected');
          selectedSize = button.dataset.size;
          addButton.disabled = false;
          note.textContent = `${selectedColor}, size ${selectedSize} selected`;
        });
      });

      addButton.addEventListener('click', () => {
        if (!selectedSize) return;

        const hasColourVariants = colourButtons.length > 0;
        const itemId = hasColourVariants
          ? `${card.dataset.productId}-${slugifyColor(selectedColor)}`
          : card.dataset.productId;
        const existing = cart.find(item => item.id === itemId && item.size === selectedSize);

        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({
            id: itemId,
            productId: card.dataset.productId,
            name: product.name,
            color: selectedColor,
            price: product.price,
            image: selectedPrimaryImage().src,
            size: selectedSize,
            quantity: 1
          });
        }

        saveCart();
        addButton.textContent = 'Added to bag';
        note.textContent = `${selectedColor}, size ${selectedSize} added`;
        setTimeout(() => { addButton.textContent = 'Add to bag'; }, 1200);
        renderCart();
        openCart();
      });
    });

    document.getElementById('cartOpen')?.addEventListener('click', openCart);
    document.getElementById('cartClose')?.addEventListener('click', closeAll);

    document.getElementById('menuOpen')?.addEventListener('click', () => {
      closeAll();
      mobileNav.classList.add('open');
      mobileNav.setAttribute('aria-hidden', 'false');
      body.classList.add('locked');
    });
    document.getElementById('menuClose')?.addEventListener('click', closeAll);
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeAll));
    document.querySelectorAll('.mobile-category-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const category = toggle.closest('.mobile-category');
        const isOpen = category.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    });

    document.getElementById('searchOpen')?.addEventListener('click', () => {
      closeAll();
      searchPanel.classList.add('open');
      searchPanel.setAttribute('aria-hidden', 'false');
      setOverlay(true);
      setTimeout(() => document.getElementById('searchInput').focus(), 350);
    });
    document.getElementById('searchClose')?.addEventListener('click', closeAll);

    if (shopButton && megaMenu) {
      shopButton.addEventListener('click', () => {
        const willOpen = !megaMenu.classList.contains('open');
        closeAll();
        if (willOpen) {
          megaMenu.classList.add('open');
          megaMenu.setAttribute('aria-hidden', 'false');
        }
      });
    }
    megaMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeAll));

    overlay?.addEventListener('click', closeAll);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeAll();
    });

    document.getElementById('newsletterForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const email = document.getElementById('email');
      const note = document.getElementById('formNote');
      note.textContent = `You're on the list — ${email.value}`;
      email.value = '';
    });

    document.getElementById('searchInput')?.addEventListener('input', event => {
      const message = document.getElementById('searchMessage');
      const term = event.target.value.trim().toLowerCase();
      const menMatch = ['compression', 'shirt', 'top', 'tank', 'black', 'white', 'navy', 'long sleeve', 'short sleeve', 'xs', 'small', 'medium', 'large', 'xl'].some(keyword => term.includes(keyword));
      const womenMatch = ['women', 'short', 'shorts', 'contour', 'lavender', 'raspberry', 'white', 'black', 'electric blue', 'blue', 'purple', 'violet'].some(keyword => term.includes(keyword));

      if (!term) {
        message.innerHTML = 'Search live NAGYM products by style, colour or category.';
        return;
      }

      const results = [];
      if (menMatch) {
        results.push('<a href="./men.html#mens-tshirts"><strong>Men’s Compression Shirts</strong></a>');
      }
      if (womenMatch) {
        results.push('<a href="./women.html#womens-shorts"><strong>Women’s Contour Shorts — $45.00 · 5 colours</strong></a>');
      }

      message.innerHTML = results.length
        ? `Found: ${results.join(' · ')}`
        : `No live products found for “${event.target.value.trim()}”.`;
    });
    document.getElementById('searchMessage')?.addEventListener('click', event => {
      if (event.target.closest('a')) closeAll();
    });

    renderCart();
    const yearElement = document.getElementById('year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();

    const cartPageItems = document.getElementById('cartPageItems');
    const cartPageSubtotal = document.getElementById('cartPageSubtotal');
    const cartPageCount = document.getElementById('cartPageCount');

    const renderCartPage = () => {
      if (!cartPageItems) return;
      const quantity = cartQuantity();
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (cartPageCount) cartPageCount.textContent = `${quantity} item${quantity === 1 ? '' : 's'}`;
      if (cartPageSubtotal) cartPageSubtotal.textContent = money(total);

      if (!cart.length) {
        cartPageItems.innerHTML = `<div class="page-empty"><h2>Your bag is empty.</h2><p>Add something built for the work.</p><div class="page-links" style="justify-content:center"><a class="button" href="./men.html">Shop Men</a><a class="button" href="./women.html">Shop Women</a></div></div>`;
        const checkoutLink = document.getElementById('cartCheckoutLink');
        if (checkoutLink) { checkoutLink.setAttribute('aria-disabled', 'true'); checkoutLink.style.opacity = '.45'; checkoutLink.style.pointerEvents = 'none'; }
        return;
      }

      cartPageItems.innerHTML = cart.map((item, index) => `
        <article class="page-cart-item">
          <img src="${item.image}" alt="${item.color} ${item.name}">
          <div class="page-cart-item-main">
            <div class="page-cart-item-top"><div><h3>${item.name}</h3><p>${item.color} · Size ${item.size}</p></div><strong>${money(item.price * item.quantity)}</strong></div>
            <div class="page-cart-item-bottom">
              <div class="quantity-control"><button type="button" data-page-cart="decrease" data-index="${index}">−</button><span>${item.quantity}</span><button type="button" data-page-cart="increase" data-index="${index}">＋</button></div>
              <button class="remove-item" type="button" data-page-cart="remove" data-index="${index}">Remove</button>
            </div>
          </div>
        </article>`).join('');

      cartPageItems.querySelectorAll('[data-page-cart]').forEach(button => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.index);
          const action = button.dataset.pageCart;
          if (!cart[index]) return;
          if (action === 'increase') cart[index].quantity += 1;
          if (action === 'decrease') cart[index].quantity -= 1;
          if (action === 'remove' || cart[index].quantity <= 0) cart.splice(index, 1);
          saveCart();
          renderCart();
          renderCartPage();
          renderCheckoutSummary();
        });
      });
    };

    const renderCheckoutSummary = () => {
      const checkoutItems = document.getElementById('checkoutItems');
      const checkoutTotal = document.getElementById('checkoutTotal');
      if (!checkoutItems) return;
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      checkoutItems.innerHTML = cart.length ? cart.map(item => `<div class="summary-row"><span>${item.name}<br><small>${item.color} · ${item.size} · Qty ${item.quantity}</small></span><strong>${money(item.price * item.quantity)}</strong></div>`).join('') : '<p>Your bag is empty.</p>';
      if (checkoutTotal) checkoutTotal.textContent = money(total);
      const button = document.getElementById('placeOrderButton');
      if (button && !cart.length) button.disabled = true;
    };

    document.getElementById('checkoutForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const note = document.getElementById('checkoutMessage');
      if (note) note.textContent = 'Checkout is ready for a payment provider connection. No payment has been taken.';
    });

    renderCartPage();
    renderCheckoutSummary();
