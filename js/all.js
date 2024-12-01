const customerApi = `${baseUrl}/api/livejs/v1/customer/${apiPath}`;
let productData = [];
let cartData = [];
let cartTotal = 0;
const productList = document.querySelector('.productWrap');
const productSelect = document.querySelector('.productSelect');
const cartList = document.querySelector('.shoppingCart-tableList');
const cartListTotal = document.querySelector('.js-total');
const discardAllBtn = document.querySelector('.discardAllBtn');

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

//取得產品列表
function getProductList() {
    axios.get(`${customerApi}/products`).
        then(response => {
            productData = response.data.products;
            renderProductList(productData);
        }).
        catch(error => {
            console.log(error);
        });
}

//渲染產品 
function renderProductList(productData) {
    let str = '';

    productData.forEach(item => {
        str += `<li class="productCard">
                <h4 class="productType">新品</h4>
                <img src="${item.images}" alt="">
                <a href="#" class="addCardBtn" data-id=${item.id}>加入購物車</a>
                <h3>${item.title}</h3>
                <del class="originPrice">NT$${item.origin_price}</del>
                <p class="nowPrice">NT$${item.price}</p>
            </li>`;
    });

    productList.innerHTML = str;
}

//篩選產品
function filterProduct(category) {
    const result = [];
    productData.forEach(product => {
        if (product.category === category) {
            result.push(product);
        }
    });
    renderProductList(result);
}

productSelect.addEventListener('change', (e) => {
    const category = e.target.value;

    if (category === '全部') {
        renderProductList(productData);
    }
    else {
        filterProduct(category);
    }
})

//渲染購物車
function getCartList() {
    axios.get(`${customerApi}/carts`).
        then(response => {
            console.log(response.data.carts);
            cartData = response.data.carts;
            cartTotal = response.data.finalTotal;
            renderCartList(cartData, cartTotal);
        }).
        catch(error => {
            console.log(error);
        });
}

function renderCartList(cartData, cartTotal) {
    if (cartData.length === 0) {
        cartList.innerHTML = '購物車沒有商品';
        cartListTotal.textContent = 0;
        discardAllBtn.classList.add('disabled');
        return;
    }

    let str = '';

    cartData.forEach(cart => {
        str += `<tr data-id="${cart.id}">
            <td>
              <div class="cardItem-title">
                <img src="${cart.product.image}" alt="">
                <p>${cart.product.title}</p>
              </div>
            </td>
            <td>NT$${cart.product.price}</td>
            <td><button type="button" class="updateCartBtn minusBtn">-</button> ${cart.quantity} <button type="button" class="updateCartBtn addBtn">+</button></td>
            <td>NT$${cart.product.price * cart.quantity}</td>
            <td class="discardBtn">
              <a href="#" class="material-icons">
                clear
              </a>
            </td>
          </tr>`;
    });

    cartList.innerHTML = str;
    cartListTotal.textContent = cartTotal;
    discardAllBtn.classList.remove('disabled');
}

//加入購物車
function addCart(productId) {
    const addCardBtns = document.querySelectorAll('.addCardBtn');
    addCardBtns.forEach(item => {
        item.classList.add('disabled');
    });
    let numCheck = 1;
    cartData.forEach(item => {
        if (item.product.id === productId) {
            numCheck = item.quantity += 1;
        }
    });

    const data = {
        "data": {
            "productId": productId,
            "quantity": numCheck
        }
    };

    axios.post(`${customerApi}/carts`, data).
        then(response => {
            Toast.fire({
                icon: "success",
                title: "商品成功加入購物車"
            });
            cartData = response.data.carts;
            cartTotal = response.data.finalTotal;
            renderCartList(cartData, cartTotal);
            addCardBtns.forEach(item => {
                item.classList.remove('disabled');
            });
        }).
        catch(error => {
            console.log(error);
        });
}

productList.addEventListener('click', (e) => {
    e.preventDefault();

    let addCartClass = e.target.getAttribute('class');
    if (addCartClass !== 'addCardBtn') {
        return;
    }

    let productId = e.target.getAttribute('data-id');
    addCart(productId);
});

//編輯購物車產品數量
function updateCart(cartId, qty) {
    const updateCartBtns = document.querySelectorAll('.updateCartBtn');
    updateCartBtns.forEach(item => {
        item.classList.add('disabled');
    });

    const data = {
        "data": {
            "id": cartId,
            "quantity": qty
        }
    };

    axios.patch(`${customerApi}/carts`, data).
        then(response => {
            Toast.fire({
                icon: "success",
                title: "成功修改購物車數量"
            });
            cartData = response.data.carts;
            cartTotal = response.data.finalTotal;
            renderCartList(cartData, cartTotal);
            updateCartBtns.forEach(item => {
                item.classList.remove('disabled');
            });
        }).
        catch(error => {
            console.log(error);
        });
}


//刪除所有購物車
function deleteAllCart() {
    Swal.fire({
        title: "確定要刪除所有購物車內容嗎?",
        text: "刪除後無法還原",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
    }).then((result) => {
        if (result.isConfirmed) {
            axios.delete(`${customerApi}/carts`).
                then(response => {
                    cartData = response.data.carts;
                    cartTotal = response.data.finalTotal;
                    renderCartList(cartData, cartTotal);
                }).
                catch(error => {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: "購物車已清空，請勿重複點擊",
                    });
                });
            Swal.fire({
                title: "已刪除",
                text: "刪除所有購物車內容成功",
                icon: "success"
            });
        }
    });
}

discardAllBtn.addEventListener('click', (e) => {
    e.preventDefault();
    deleteAllCart();
});

//刪除單一購物車
function deleteCart(cartId) {
    Swal.fire({
        title: "確定要刪除此筆購物車內容嗎?",
        text: "刪除後無法還原",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
    }).then((result) => {
        if (result.isConfirmed) {
            axios.delete(`${customerApi}/carts/${cartId}`).
                then(response => {
                    cartData = response.data.carts;
                    cartTotal = response.data.finalTotal;
                    renderCartList(cartData, cartTotal);
                }).
                catch(error => {
                    console.log(error);
                });
            Swal.fire({
                title: "已刪除",
                text: "刪除單筆購物車內容成功",
                icon: "success"
            });
        }
    });
}

cartList.addEventListener('click', (e) => {
    e.preventDefault();
    const cartId = e.target.closest('tr').getAttribute('data-id');
    let deleteCartClass = e.target.closest('td').getAttribute('class');
    let quantityModifyClass = e.target.getAttribute('class');
    if (deleteCartClass === 'discardBtn') {
        deleteCart(cartId);
    }

    if (quantityModifyClass === 'updateCartBtn addBtn') {
        let result = {};
        cartData.forEach(item => {
            if (item.id === cartId) {
                result = item;
            }
        });

        let qty = result.quantity += 1;
        updateCart(cartId, qty);
    }

    if (quantityModifyClass === 'updateCartBtn minusBtn') {
        let result = {};
        cartData.forEach(item => {
            if (item.id === cartId) {
                result = item;
            }
        });

        if (result.quantity === 1) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "購物車商品最小數量為1",
            });
            return;
        }

        let qty = result.quantity -= 1;
        updateCart(cartId, qty);
    }

});

//送出訂單
const orderInfoForm = document.querySelector('.orderInfo-form');

function checkForm() {
    const constraints = {
        姓名: {
            presence: { message: "^必填" },
        },
        電話: {
            presence: { message: "^必填" },
        },
        Email: {
            presence: { message: "^必填" },
            email: { message: "^請輸入正確的信箱格式" },
        },
        寄送地址: {
            presence: { message: "^必填" },
        },
    };

    const fieldArr = Object.keys(constraints);
    fieldArr.forEach(item => {
        const message = document.querySelector(`[data-message="${item}"]`);
        message.textContent = '';
    })

    const errors = validate(orderInfoForm, constraints);
    if (errors) {
        const errorsArr = Object.keys(errors);
        errorsArr.forEach(item => {
            const message = document.querySelector(`[data-message="${item}"]`);
            message.textContent = errors[item][0];
        })
    }
    return errors;
}
function sendOrder() {
    if (cartData.length === 0) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "購物車不得為空",
        });
        return;
    }

    if (checkForm()) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "資料輸入有誤",
        });
        return;
    }
    const customerName = document.querySelector("#customerName");
    const customerPhone = document.querySelector("#customerPhone");
    const customerEmail = document.querySelector("#customerEmail");
    const customerAddress = document.querySelector("#customerAddress");
    const tradeWay = document.querySelector("#tradeWay");

    const data = {
        data: {
            user: {
                name: customerName.value.trim(),
                tel: customerPhone.value.trim(),
                email: customerEmail.value.trim(),
                address: customerAddress.value.trim(),
                payment: tradeWay.value,
            },
        },
    };


    Swal.fire({
        title: "確定要送出預定資料?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "確定",
        cancelButtonText: "取消"
    }).then((result) => {
        if (result.isConfirmed) {
            axios.post(`${customerApi}/orders`, data).
                then(response => {
                    orderInfoForm.reset();
                    getCartList();
                }).
                catch(error => {
                    console.log(error);
                });
            Swal.fire({
                title: "訂單已送出",
                icon: "success"
            });
        }
    });
}

const orderInfoBtn = document.querySelector('.orderInfo-btn');
orderInfoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sendOrder();
});

//初始化
function init() {
    getProductList();
    getCartList();
}

init();