class Async {
    async post(url, formData) {
        var promise = new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
			xhr.timeout = 0;
            xhr.open('POST', url);
            xhr.onload = function() {
                if (xhr.status === 200) { resolve(xhr.responseText);
                } else if (xhr.status !== 200) { resolve('Request failed.... ' + xhr.status);
                } else { resolve(xhr.responseText); }
            };
            xhr.send(formData);
        });
        var res = await promise;
        return res;
    }
	async get(url) {
		var promise = new Promise((resolve, reject) => {
			var xhr = new XMLHttpRequest();
			xhr.timeout = 0;
			xhr.open('GET', url);
			xhr.onload = function() {
				if (xhr.status === 200) { resolve(xhr.responseText);
				} else if (xhr.status !== 200) { resolve('Request failed.... ' + xhr.status);
				} else { resolve(xhr.responseText); }
			};
			xhr.send();
		});
		var res = await promise;
		return res;
	}	
}





