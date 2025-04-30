import { LightningElement, track, wire } from 'lwc';
import fetchLocations from '@salesforce/apex/GoogleMapsService.fetchLocations';
import updatePcrVanRecord from '@salesforce/apex/GoogleMapsService.updatePcrVanRecord';
import getPcrVanRecords from '@salesforce/apex/GoogleMapsService.getPcrVans';

const PCR_VAN_OBJECT = 'PCR_Van__c'; // API name of the object
const PCR_VAN_LIST_VIEW = 'All'; // Name of the list view to fetch records

const columns = [
    { label: 'Van Name', fieldName: 'name' },
    { label: 'Status', fieldName: 'status' },
    { label: 'Current Location', fieldName: 'location' }
];

export default class PcrVanDispatch extends LightningElement {
    data = [
        { id: '1', name: 'Van 1', status: 'Available', location: 'Sarjapur' },
        { id: '2', name: 'Van 2', status: 'In Use', location: 'Vijaynagar' },
        { id: '3', name: 'Van 3', status: 'Available', location: 'Whitefield' },
        { id: '4', name: 'Van 4', status: 'In Use', location: 'Jaynagar' },
        { id: '5', name: 'Van 5', status: 'Available', location: 'J P Nagar' },
        { id: '6', name: 'Van 6', status: 'In Use', location: 'Vidyanagar' },
        { id: '7', name: 'Van 7', status: 'Available', location: 'Kalyan nagar' },
        { id: '8', name: 'Van 8', status: 'In Use', location: 'Marathalli' }
    ];
    // dataMap = []; // Initialize data as an empty array
    columns = columns;
    updatedData = [...this.data]; // Clone the data to allow updates
    selectedLocationValue = '';
    selectedVan = '';
    @track locationOptions = []; // Track location options dynamically
    selectedLocation = {};
    selectedVanId = '';
    // mapMarkers = [];

    center = {
        location: {
            Latitude: 12.9716, // Bangalore Latitude
            Longitude: 77.5946
        }
    };

    mapMarkers = [
        {
            location: {
                Latitude: 12.854922,
                Longitude: 77.788116
            },
            title: 'Van 1',
            description: 'This is Sarjapur'
        },
        {
            location: {
                Latitude: 12.971940,
                Longitude: 77.532745
            },
            title: 'Van 2',
            description: 'This is Vijaynagar'
        },
        {
            location: {
                Latitude: 12.971389,
                Longitude: 77.750130
            },
            title: 'Van 3',
            description: 'This is Whitefield'
        },
        {
            location: {
                Latitude: 12.930149,
                Longitude: 77.587723
            },
            title: 'Van 4',
            description: 'This is Jaynagar'
        },
        {
            location: {
                Latitude: 12.895990,
                Longitude: 77.558200
            },
            title: 'Van 5',
            description: 'This is J P Nagar'
        },
        {
            location: {
                Latitude: 12.824456,
                Longitude: 77.685633
            },
            title: 'Van 6',
            description: 'This is Vidyanagar'
        },
        {
            location: {
                Latitude: 13.028005,
                Longitude: 77.639969
            },
            title: 'Van 7',
            description: 'This is Kalyan nagar'
        },
        {
            location: {
                Latitude: 12.9560,
                Longitude: 77.7092
            },
            title: 'Van 8',
            description: 'This is Marathalli'
        }
    ];

    get vanOptions() {
        const vans = [...new Set(this.data.map(item => item.name))];
        return vans.map(van => ({ label: van, value: van }));
    }

    get isDispatchDisabled() {
        return !(this.selectedLocationValue && this.selectedVan);
    }

    // @wire(getPcrVanRecords)
    // wiredPcrRecords({ error, data }) {
    // try{
    //     if (data) {
    //         console.log('List view data:', data);
    //         data.forEach(record => {
    //             this.dataMap.push({id: record.Id,
    //             name: record.Name,
    //             status: record.Status__c,
    //             location: record.Police_Station__r.BillingAddress.city})
    //         });
    //         console.log('Processed data:', this.dataMap);
    //         this.updatedData = [...this.dataMap]; // Update the cloned data
    //         data.forEach(item => {

    //             this.mapMarkers.push({
    //                 location: {
    //                     Latitude: item.Police_Station__r.BillingLatitude,
    //                     Longitude: item.Police_Station__r.BillingLongitude
    //                 },
    //                 title: item.name,
    //                 description: `This is in ${item.BillingAddress.city} area`
    //             });
    //         });
    //         console.log('Map markers:', this.mapMarkers);
    //     }
    //     if (error) {
    //         console.error('Error fetching list view:', JSON.stringify(error));
    //     }
    // }catch(error) {
    //     console.log('Error fetching list view:', error);
    // }
    // }

    async handleLocationSearch(event) {
        const searchTerm = event.target.value;

        if (searchTerm.length > 2) { // Fetch suggestions only if the input is meaningful
            try {
                const locations = await fetchLocations({ searchTerm });
                this.locationOptions = locations.map(location => ({
                    label: location.description,
                    value: location.place_id,
                    latitude: location.latitude,
                    longitude: location.longitude
                }));
            } catch (error) {
                console.error('Error fetching locations:', error);
                this.locationOptions = [];
            }
        } else {
            this.locationOptions = [];
        }
    }

    handleLocationSelect(event) {
        console.log('Location selected:', event.target.innerText);
        const selectedLocationName = event.target.innerText;
        console.log('Selected location ID:', selectedLocationName);
        // const selectedLocation = this.locationOptions.find(option => option.label.includes(selectedLocationName.slice(0, 6)));
        const selectedLocation = this.locationOptions.find(option => option.label === selectedLocationName);
        console.log('Selected location:', selectedLocation);

        if (selectedLocation) {
            this.selectedLocation = selectedLocation;
            this.selectedLocationValue = selectedLocation.label;
            this.locationOptions = []; // Clear the dropdown after selection
        }
    }

    handleVanChange(event) {
        this.selectedVan = event.detail.value;
        this.selectedVanId = this.updatedData.find(item => item.name === this.selectedVan).id;
    }

    handleDispatch() {
        // Update the location of the selected van
        const selectedLocationRecord = this.locationOptions.find(option => option.label === this.selectedLocationValue);
        this.updateVanLocation(selectedLocationRecord);
        this.updatedData = this.updatedData.map(item => {
            if (item.name === this.selectedVan) {
                return { ...item, location: this.selectedLocationValue, status: 'In Use' };
            }
            return item;
        });

        this.mapMarkers = this.mapMarkers.map(marker => {
            if (marker.title === this.selectedVan) {
                return {
                    ...marker,
                    location: {
                        Latitude: this.selectedLocation.latitude,
                        Longitude: this.selectedLocation.longitude
                    },
                    description: `This is ${this.selectedLocationValue}`
                };
            }
            return marker;
        });

        alert(`"${this.selectedVan}" dispatched to "${this.selectedLocationValue}"`);

        // Reset selections
        this.selectedLocation = {};
        this.selectedVan = '';
        this.selectedLocationValue = '';
        this.locationOptions = [];
    }

    async updateVanLocation(selectedLocationRecord) {
        console.log('Updating van location...', selectedLocationRecord);
        const message = await updatePcrVanRecord({
            Id: this.selectedVan, latitude: Number(selectedLocationRecord.latitude), longitude: Number(selectedLocationRecord.longitude), locationName: this.selectedLocationValue
        });
        console.log('Update message:', message);
    }
}