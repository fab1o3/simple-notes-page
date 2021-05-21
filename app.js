var app = new Vue({
    el: '#app',
    data: {
        password: null,
        isPasswordCorrect: false,
        settings: {
            'jsonStorage': {
                'value': null,
                'label': 'JSON Storage URL',
                'type': 'url'
            },
            'lockTimeout': {
                'value': 300,
                'label': 'Lock timeout (seconds)',
                'type': 'text'
            }
        },
        plain: {},
        encrypted: {},
        selectedTab: 'news'
    },
    mounted: function () {
        this.unlock();
        setInterval(this.refresh, this.settings['lockTimeout'].value * 1000);
    },
    methods: {
        init: function () {
            Object.keys(this.settings).forEach(element => {
                this.settings[element].value = localStorage.getItem(element);
            });
            Object.keys(this.plain).forEach(element => {
                this.plain[element].value = localStorage.getItem(element);
            });
            if (localStorage.getItem('encrypted')) {
                this.encrypted = JSON.parse(sjcl.decrypt(this.password, localStorage.getItem('encrypted')));
            }
        },
        load: function () {
            axios.get(this.plain['jsonStorage'].value).then((response) => {
                let remoteStorage = response.data;
                var keys = Object.keys(remoteStorage);
                keys.forEach(function (key) {
                    localStorage.setItem(key, remoteStorage[key]);
                });
                Swal.fire('Local storage updated');
                this.init();
                this.$forceUpdate();
            })
                .catch((error) => {
                    Swal.fire({
                        icon: 'error',
                        text: JSON.stringify(error)
                    });
                });
        },
        save: function () {
            Object.keys(this.settings).forEach(element => {
                if (this.settings[element].value) {
                    localStorage.setItem(element, this.settings[element].value);
                }
            });

            Object.keys(this.plain).forEach(element => {
                localStorage.setItem(element, this.plain[element].value);
            });

            localStorage.setItem('encrypted', sjcl.encrypt(this.password, JSON.stringify(this.encrypted)));

            if (this.settings['jsonStorage'].value) {
                axios.put(this.settings['jsonStorage'].value, localStorage).then(function (response) {
                    Swal.fire('Remote storage updated');
                })
                    .catch((error) => {
                        Swal.fire({
                            icon: 'error',
                            text: JSON.stringify(error)
                        });
                    });
            }
        },
        copy: function (text) {
            navigator.clipboard.writeText(text).then(function () {
                Swal.fire('Copying to clipboard was successful!');
            });
        },
        add: function () {
            Swal.fire({
                title: 'Add a field',
                html:
                    '<input id="name" class="swal2-input" placeholder="Name">' +
                    '<input id="label" class="swal2-input" placeholder="Label">' +
                    '<select id="type" class="swal2-input">' +
                    '<option value="url">url</option>' +
                    '<option value="textarea">textarea</option>' +
                    '<option value="password">password</option>' +
                    '<option value="link">link</option>' +
                    '</select>' +
                    '<input type="checkbox" id="is_encrypted">' +
                    '<span class="swal2-label">Encrypted</span>',
                showCancelButton: true,
                focusConfirm: false,
                preConfirm: () => {
                    let e = document.getElementById('type');
                    return [
                        document.getElementById('name').value,
                        document.getElementById('label').value,
                        e.options[e.selectedIndex].value
                    ]
                }
            }).then((result) => {
                if (result.value) {
                    this.encrypted[result.value[0]] = {};
                    this.encrypted[result.value[0]].label = result.value[1];
                    this.encrypted[result.value[0]].type = result.value[2];
                    this.$forceUpdate();
                }
            });
        },
        remove: function (field) {
            delete this.encrypted[field];
            this.$forceUpdate();
        },
        unlock: function () {
            Swal.fire({
                title: 'Enter your password',
                input: 'password',
                inputPlaceholder: 'Enter your password',
                showCancelButton: false,
                showCloseButton: false,
                allowOutsideClick: false,
                inputValidator: (value) => {
                    if (!value) {
                        return 'Password cannot be empty!'
                    }
                },
                inputAttributes: {
                    maxlength: 10,
                    autocapitalize: 'off',
                    autocorrect: 'off'
                }
            }).then((result) => {
                this.password = result.value;

                if (localStorage.getItem('encrypted')) {
                    try {
                        this.isPasswordCorrect = true;
                        this.init();
                    } catch {
                        this.isPasswordCorrect = false;
                        Swal.fire({
                            icon: 'error',
                            title: 'Password is not correct!'
                        });
                    }
                } else {
                    this.isPasswordCorrect = true;
                    this.init();
                }
            });
        },
        isActive: function (name) {
            if (this.selectedTab === name) {
                return 'is-active';
            }
        },
        refresh: function () {
            location.reload();
        }
    }
});
