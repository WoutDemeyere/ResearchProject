const loadObjects = () => {
        {
                geometry = new THREE.BoxGeometry(10, 3, 1);
                material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color("white")
                });
                cube = new THREE.Mesh(geometry, material);
        }

        {
                geometry = new THREE.SphereGeometry(5, 32, 32); // (radius, widthSegments, heightSegments)
                material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
                sphere = new THREE.Mesh(geometry, material);
        }

        // {
        //         edges = new THREE.EdgesGeometry(geometry);
        //         line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        //                 color: 0xffffff
        //         }));
        // }

}