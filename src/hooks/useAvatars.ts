"use client";
import { db } from "@/firebase/firebaseClient";
import { AVATAR_GROUP_COLLECTION, AVATAR_GROUP_LOOK_COLLECTION, OWNERSHIP_TYPE, PER_PAGE_LIMIT } from "@/libs/constants";
import { createUserAvatarId } from "@/libs/utils";
import { AvatarGroup, AvatarLook } from "@/types/heygen";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import { DocumentData, QueryDocumentSnapshot, collection, getCountFromServer, limit, onSnapshot, orderBy, query, startAfter, startAt, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useHeyGen } from "./useHeyGen";

export const useAvatars = () => {
  const [personalAvatarGroups, setPersonalAvatarGroups] = useState<AvatarGroup[]>([]);
  const [publicAvatarGroups, setPublicAvatarGroups] = useState<AvatarGroup[]>([]);
  const [isFetchingPublicAvatarGroups, setIsFetchingPublicAvatarGroups] = useState(false);
  const [isFetchingPersonalAvatarGroups, setIsFetchingPersonalAvatarGroups] = useState(false);

  const [selectedAvatarGroup, setSelectedAvatarGroup] = useState<AvatarGroup | null>(null);
  const [selectedAvatarLooks, setSelectedAvatarLooks] = useState<AvatarLook[]>([]);
  const [isFetchingAvatarLooks, setIsFetchingAvatarLooks] = useState(false);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);

  const uid = useAuthStore((state) => state.uid);
  const profile = useProfileStore((state) => state.profile);
  const invalid_heygen_api_key = useProfileStore((state) => state.invalid_heygen_api_key);

  const { isFetchingAvatarGroupsFromHeygen, fetchAvatarGroupsFromHeygen } = useHeyGen();
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | undefined>();
  const [lastVisibleStack, setLastVisibleStack] = useState<QueryDocumentSnapshot<DocumentData, DocumentData>[]>([]);
  // const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const _profile = useMemo(() => {
    return profile ? {
      heygen_api_key: profile.heygen_api_key,
      heygen_key_updated: profile.heygen_key_updated,
    } : {
      heygen_api_key: "",
      heygen_key_updated: true,
    }
  }, [profile]);

  useEffect(() => {
    if (!uid || !_profile.heygen_api_key || invalid_heygen_api_key != null) return;

    setIsFetchingPersonalAvatarGroups(true);

    const personalAvatarGroupsCollection = query(
      collection(db, AVATAR_GROUP_COLLECTION),
      where('type', '==', OWNERSHIP_TYPE[1]),
      where('owner', '==', uid)
    );
    const unsubscribePersonalAvatarGroups = onSnapshot(
      personalAvatarGroupsCollection,
      (snapshot) => {
        setIsFetchingPersonalAvatarGroups(false);
        const avatarGroupsList = snapshot.docs.map(
          (doc) => doc.data() as AvatarGroup
        );
        if (avatarGroupsList.length == 0 || _profile.heygen_key_updated) {
          fetchAvatarGroupsFromHeygen();
        }
        setPersonalAvatarGroups(avatarGroupsList);
      }
    );

    setIsFetchingPublicAvatarGroups(true);
    const publicAvatarGroupsCollection = query(
      collection(db, AVATAR_GROUP_COLLECTION),
      where('type', '==', OWNERSHIP_TYPE[0]),
      where('preview_image_url', '!=', null),
      orderBy('created_at', "desc"),
      limit(PER_PAGE_LIMIT)
    );

    const unsubscribePublicAvatarGroups = onSnapshot(
      publicAvatarGroupsCollection,
      (snapshot) => {
        setIsFetchingPublicAvatarGroups(false);
        const avatarGroupsList = snapshot.docs.map(
          (doc) => doc.data() as AvatarGroup
        );
        setPublicAvatarGroups(avatarGroupsList);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        const updatedStack = lastVisibleStack;
        updatedStack.push(snapshot.docs[0]);
        setLastVisibleStack(updatedStack);
      }
    );

    return () => {
      unsubscribePersonalAvatarGroups();
      unsubscribePublicAvatarGroups();
    };
  }, [uid, _profile, invalid_heygen_api_key]);

  useEffect(() => {
    if (!uid || selectedAvatarGroup == null) return;

    setIsFetchingAvatarLooks(true);
    const avatarGroupLooksCollection = query(
      collection(db, AVATAR_GROUP_LOOK_COLLECTION),
      selectedAvatarGroup.type == 'public' ? where('group_id', '==', selectedAvatarGroup.id) : where('user_avatar_id', '==', createUserAvatarId(uid, selectedAvatarGroup.id)),
      orderBy('created_at', "desc"),
      limit(5)
    );
    const unsubscribePublicAvatarGroups = onSnapshot(
      avatarGroupLooksCollection,
      (snapshot) => {
        setIsFetchingAvatarLooks(false);
        const avatarGroupLooksList = snapshot.docs.map(
          (doc) => doc.data() as AvatarLook
        );
        if (avatarGroupLooksList.length == 0) {
          fetchAvatarGroupsFromHeygen(selectedAvatarGroup.id);
        }
        setSelectedAvatarLooks(avatarGroupLooksList);
      }
    );

    return () => {
      unsubscribePublicAvatarGroups()
    };
  }, [uid, selectedAvatarGroup]);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(
        collection(db, AVATAR_GROUP_COLLECTION),
        where('type', '==', OWNERSHIP_TYPE[0]),
        where('preview_image_url', '!=', null),
        orderBy('created_at', "desc")
      );

      const totalCounts = await getCountFromServer(q);
      console.log("totalCount", totalCounts.data().count);
      setTotalPages(Math.ceil(totalCounts.data().count / PER_PAGE_LIMIT));
      console.log("totalPages", Math.ceil(totalCounts.data().count / PER_PAGE_LIMIT));
    };

    fetchData();
  }, [publicAvatarGroups]);

  const fetchNextPage = async () => {
    if (!lastVisible) return;

    const publicAvatarGroupsCollection = query(
      collection(db, AVATAR_GROUP_COLLECTION),
      where('type', '==', OWNERSHIP_TYPE[0]),
      where('preview_image_url', '!=', null),
      orderBy('created_at', "desc"),
      startAfter(lastVisible),
      limit(PER_PAGE_LIMIT)
    );

    onSnapshot(
      publicAvatarGroupsCollection,
      (snapshot) => {
        setIsFetchingPublicAvatarGroups(false);
        const avatarGroupsList = snapshot.docs.map(
          (doc) => doc.data() as AvatarGroup
        );
        setPublicAvatarGroups(avatarGroupsList);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

        const updatedStack = lastVisibleStack;
        updatedStack.push(snapshot.docs[0]);
        console.log("updatedStack.push", lastVisibleStack);
        setLastVisibleStack(updatedStack);
        setCurrentPageNumber(currentPageNumber + 1);
        console.log("fetchNextPage", avatarGroupsList);
      }
    );
  }



  //  Implement Previous Page Logic
  const fetchPreviousPage = async () => {
    if (currentPageNumber <= 1) return;
    const updatedStack = lastVisibleStack;
    updatedStack.pop();
    setLastVisibleStack(updatedStack);
    const prevVisible = lastVisibleStack[lastVisibleStack.length - 1];
    const publicAvatarGroupsCollection = query(
      collection(db, AVATAR_GROUP_COLLECTION),
      where('type', '==', OWNERSHIP_TYPE[0]),
      where('preview_image_url', '!=', null),
      orderBy('created_at', "desc"),
      startAt(prevVisible),
      limit(PER_PAGE_LIMIT)
    );
    onSnapshot(
      publicAvatarGroupsCollection,
      (snapshot) => {
        setIsFetchingPublicAvatarGroups(false);
        const avatarGroupsList = snapshot.docs.map(
          (doc) => doc.data() as AvatarGroup
        );
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setPublicAvatarGroups(avatarGroupsList);
        setCurrentPageNumber(currentPageNumber - 1);
      }
    );
  }
  // fetch specific page in fire base collection

  const isFetchingAvatarGroups = useMemo(() => {
    return isFetchingPersonalAvatarGroups || isFetchingPublicAvatarGroups;
  }, [isFetchingPersonalAvatarGroups, isFetchingPublicAvatarGroups]);

  const changeSelectedGroup = (_avatarGroup: AvatarGroup | null) => {
    setSelectedAvatarGroup(_avatarGroup);
    setSelectedAvatarLooks([]);
  }

  return {
    isFetchingAvatarGroupsFromHeygen,
    isFetchingAvatarGroups,
    publicAvatarGroups,
    personalAvatarGroups,
    selectedAvatarGroup,
    changeSelectedGroup,
    selectedAvatarLooks,
    isFetchingAvatarLooks,
    fetchAvatarGroupsFromHeygen,
    fetchNextPage,
    fetchPreviousPage,
    currentPageNumber,
    totalPages,
  }
}