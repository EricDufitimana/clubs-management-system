'use client';

import { useState, useEffect } from "react";

export default function TestingPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        if(!res.ok){
            console.log("Fetch failed");
        }
        console.log("Res: ", res);
        const data = await res.json();
        setUsers(data)

        console.log("Data: ", data);

      } catch (error) {
        console.log("Failed to fetch")
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();

  },[]);
  return <div>
    {loading && <p>Loading...</p>}
    <ul>
        {users.map((user)=>(
            <li>Name: {user.name}, Email: {user.email}</li>
      ))}
    </ul>

  </div>;
}
