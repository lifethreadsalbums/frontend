var apiUrl,
	ENV;

//TODO: find a better way to implement dev and prod config
if (window.location.hostname==='localhost') {
	apiUrl = '/pace-backend/';
	ENV = 'debug';
} else {
	apiUrl = '';
	ENV = 'production';
}